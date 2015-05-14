"""Brython-Server utility functions for Github and session/cache management

"""
import os, urllib, json, base64, random, string, redis
from flask import session, url_for
from definitions import *

def github_client_id():
    """Retrieve the Github Client ID."""
    return os.environ.get(ENV_GITHUBCLIENTID,'')
    
    
def github_client_secret():
    """Retriev the Github Client Secret."""
    return os.environ.get(ENV_GITHUBSECRET,'')


def newgithubstate():
    """Create new Github STATE for login
    
    Sets a random string as local session state for Github, if not
    already set.
    
    Return the state string
    """
    state = session.get(SESSION_GITHUBSTATE, '')
    if SESSION_GITHUBSTATE not in session:
        N = 20
        state = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(N))
        session[SESSION_GITHUBSTATE] = state
    return state


def getredirecturl():
    """Construct a redirect URL for returning here from Github
    
    Return the redirect URL
    """
    url = url_for('root', _external=True)
    if url.endswith(":80"):
        url = url[:-3]
    return url
    

def githubcontentsurl(user, repo, path):
    """Construct a "content" URL for the Github API
    
    Return the URL
    """
    url = "https://api.github.com/repos/{0}/{1}/contents/{2}".format(user, repo, path)
    return url


# Public functions    
    
def checkgithubstate(state):
    """Verify correct Github STATE has been returned.cachecontent
    
    Return True if matching, False otherwise
    """
    return state == session.get(SESSION_GITHUBSTATE, '')


def githubauthurl():
    """Construct a redirect URL TO Github.
    
    Return the URL
    """
    url = URL_GITHUBAUTHORIZE + "?"
    url += "client_id="+github_client_id()
    url += "&redirect_uri="+getredirecturl()
    url += "&scope=repo&state="+newgithubstate()
    print(url)
    return url


def githubretrievetoken(code):
    """Retrieve a user's access token from Github.
    
    Returns nothing
    """
    gitrequest = urllib.request.Request(URL_GITHUBRETRIEVETOKEN)
    gitrequest.add_header('Accept', 'application/json')
    parameters = {'client_id':github_client_id(),
        'client_secret':github_client_secret(),
        'code':code,
        'redirect_uri':getredirecturl()}
    data = urllib.parse.urlencode(parameters)
    data = data.encode('utf-8')
    response = urllib.request.urlopen(gitrequest, data)
    jsresponse = json.loads(response.read().decode("utf-8"))
    if 'access_token' in jsresponse:
        session[SESSION_ACCESSTOKEN] = jsresponse.get('access_token')
    

def githubforgetauth():
    """Forget the current Github authorization."""
    session.pop(SESSION_ACCESSTOKEN, None)


def githubrequest(user, repo, path, method='GET'):
    """Initiate a request to the Github content API.
    
    Arguments:
    user -- the Github user ID/name
    repo -- the Github user's repository name
    path -- optional path fragment or path to file in the repo
    method -- http mehthod (e.g. GET, etc.)  (Default is 'GET')
    
    Return tuple:
    gitrequest - the request object from urllib.request.Request
    token - the token being used in the request
    """
    url = githubcontentsurl(user, repo, path)
    token = session.get(SESSION_ACCESSTOKEN, os.environ.get(ENV_DEVTOKEN))
    gitrequest = urllib.request.Request(url, method=method)
    gitrequest.add_header('Authorization', 'token {0}'.format(token))
    gitrequest.add_header('User-Agent', 'Brython-Server')
    return gitrequest, token
    

def githubretrievefile(user, repo, path):
    """Retrieve a specific file from Github via API.
    
    Arguments:
    user -- the Github user ID/name
    repo -- the Github user's repository name
    path -- specific path to file within the repo

    Return tuple:
    content -- the content of the specific file
    sha -- the file sha (used for subsequent commits, if any)
    """
    jsresponse = sha = None
    requestcontext = Context(user, repo, path)
    gitrequest, token = githubrequest(user, repo, path)
    if cachedfileexists(requestcontext):
        content, sha, etag = cachedfile(requestcontext)
        gitrequest.add_header('If-None-Match', etag)
    try:
        response = urllib.request.urlopen(gitrequest)
        jsresponse = json.loads(response.read().decode("utf-8"))
        sha = jsresponse['sha']
        etag = response.getheader('ETag')
        print("Fresh content ... caching")
        cachefile(requestcontext, jsresponse, sha, etag)
    except (urllib.error.HTTPError) as err:
        if err.msg == 'Not Modified':
            print("Not changed ({0}) ... retrieving cache".format(path))
            jsresponse, sha, etag = cachedfile(requestcontext)
        else:
            raise
    encodedcontent = jsresponse['content'].encode('utf-8')
    binreturn = base64.b64decode(encodedcontent)
    try:
        return binreturn.decode('utf-8'), sha
    except UnicodeDecodeError:
        return binreturn, sha

def githubgetmainfile(user, repo, path):
    """Retrieve the 'main' Python file from a repo/directory. Function
    attempts to make a sensible decision.
    
    Arguments:
    user -- the Github user ID/name
    repo -- the Github user's repository name
    path -- specific directory path within the repo

    Return: the name of the file
    """
    jsresponse = sha = None
    requestcontext = Context(user, repo, path)
    gitrequest, token = githubrequest(user, repo, path)
    if cachedfileexists(requestcontext):
        content, sha, etag = cachedfile(requestcontext)
        gitrequest.add_header('If-None-Match', etag)
    try:
        mainfile = ''
        response = urllib.request.urlopen(gitrequest)
        jsresponse = json.loads(response.read().decode("utf-8"))
        sha = ''
        etag = response.getheader('ETag')
        print("Fresh directory content ... caching")
        cachefile(requestcontext, jsresponse, sha, etag)
    except (urllib.error.HTTPError) as err:
        if err.msg == 'Not Modified':
            print("Directory not changed ... retrieving cache")
            jsresponse, sha, etag = cachedfile(requestcontext)
        else:
            raise
    names = [f['name'] for f in filter(lambda x: x['type'] == 'file', jsresponse)]
    return selectmainfile(names)

def githubpath(user, repo, path, name):
    """Build a valid URL to file on Github.
    
    Note: This is sensitive to changes in how Github URLs work.
    
    Arguments:
    user -- the Github user ID/name
    repo -- the Github user's repository name
    path -- specific path to file within the repo
    name -- specific file name
    
    Returns URL to Github file.
    """
    retval = "https://github.com/{0}/{1}/blob/master/".format(user,repo)
    if path:
        retval += path
        if name not in path:
            retval +=  "/" + name
    else:
        retval += name
    return retval


def githubloggedin():
    """Return whether we are logged in to Github (True/False)."""
    github_token = session.get(SESSION_ACCESSTOKEN)
    return True if github_token else False


def selectmainfile(names):
    """Determine 'main' python file from a list of candidates.
    
    Arguments:
    names -- a list of candidate names
    Return: the best candidate name
    """
    mainfile = ''
    for foundname in names:
        if (mainfile == '' and len(foundname) > 3 and foundname[-3:] == '.py' or
            # Foud a python file called main.py or __main__.py? Make IT the one!
            foundname in ["main.py", "__main__.py"]):
            mainfile = foundname
    return mainfile

def cachefilekey(context):
    """Return a Redis key that is versioned and unique per installation."""
    return CACHE_VERSION + github_client_id() + json.dumps(context)
    
def cachefile(context, contents, sha, ETag):
    """Cache specific file content, with metadata.
    
    Arguments:
    context -- Context object with user, repo, path
    contents -- Raw file content (binary or text)
    sha -- sha string
    """
    r = redis.Redis()
    r.set(cachefilekey(context), json.dumps(Cachedata(contents, sha, ETag)), ex=CACHE_TIMEOUT_S)


def cachedfileexists(context):
    """Determine if a cached copy of file exists.
    
    Arguments:
    context -- Context object with user, repo, path
    Return: True if cached copy exists, False otherwise.
    """
    r = redis.Redis()
    return r.exists(cachefilekey(context))

def cachedfile(context):
    """Retrieve specific cached file content.
    
    Arguments:
    path -- the file path and name
    
    Return: 
    content -- the file content text
    sha -- the file sha
    """
    r = redis.Redis()
    raw = json.loads(r.get(cachefilekey(context)).decode("utf-8"))
    data = Cachedata(raw[0], raw[1], raw[2])
    return data.contents, data.sha, data.etag


