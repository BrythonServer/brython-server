"""
Brython-Server utility functions for Github and session/cache management
Author: E Dennison
"""

import os, urllib, json, base64, random, string, redis, urllib.parse
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
    url += "&scope=repo gist&state="+newgithubstate()
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

def finishrequestsetup(url, method):
    """Complete preparations for initiating a request to Github
    
    Arguments:
    url -- the github url for the request.
    method -- http mehthod (e.g. GET, etc.)
    
    Return tuple:
    gitrequest - the request object from urllib.request.Request
    token - the token being used in the request
    """
    token = session.get(SESSION_ACCESSTOKEN, os.environ.get(ENV_DEVTOKEN))
    gitrequest = urllib.request.Request(url, method=method)
    gitrequest.add_header('Authorization', 'token {0}'.format(token))
    gitrequest.add_header('User-Agent', 'Brython-Server')
    return gitrequest, token

def finishrequest(requestcontext, gitrequest, token, retrievalmethod, metamethod=None):
    """Boilerplate for finishing the API request to Github
    
    Arguments:
    requestcontext -- unique data identifying a github resource
    gitrequest -- request object
    token -- session token
    retrievalmethod -- function for extracting file contents from response
    metamethod -- optional function for extracting metadata from response
    
    Return tuple:
    binreturn - the resource data
    sha - the resource SHA
    """
    jsresponse = sha = None
    if cachedfileexists(requestcontext):  
        content, sha, etag = cachedfile(requestcontext)
        gitrequest.add_header('If-None-Match', etag)
    try:
        response = urllib.request.urlopen(gitrequest)
        jsresponse = json.loads(response.read().decode("utf-8"))
        sha = jsresponse.get('sha','')
        etag = response.getheader('ETag')
        cachefile(requestcontext, jsresponse, sha, etag)
    except (urllib.error.HTTPError) as err:
        if err.code == 304:  # Not Modified
            print("Not changed... retrieving cache")
            jsresponse, sha, etag = cachedfile(requestcontext)
        else:
            raise
    binreturn = retrievalmethod(jsresponse)
    session[SESSION_METADATA] = metamethod(jsresponse) if metamethod else ''
    
    try:
        return binreturn.decode('utf-8'), sha
    except UnicodeDecodeError:
        return binreturn, sha

    
def gistrequest(gistid, method='GET'):
    """Initiate a request to the Github gist API.
    
    Arguments:
    gistid -- the hex identifier for the file
    method -- http mehthod (e.g. GET, etc.)  (Default is 'GET')
    
    Return tuple:
    gitrequest - the request object from urllib.request.Request
    token - the token being used in the request
    """
    url = "https://api.github.com/gists/{0}".format(gistid)
    return finishrequestsetup(url, method)
    

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
    url = "https://api.github.com/repos/{0}/{1}/contents/{2}".format(user, repo, path)
    return finishrequestsetup(url, method)

def githubretrievegist(gistid):
    """Retrieve a gist from Github via API.
    
    Arguments:
    gistid -- hex string identifying a gist

    Return tuple:
    content -- the content of the specific file
    sha -- the file sha (used for subsequent commits, if any)
    """
    requestcontext = Context('', '', gistid)
    gitrequest, token = gistrequest(gistid)
    return finishrequest(requestcontext, 
        gitrequest, 
        token, 
        lambda x: x['files'][list(x['files'].keys())[0]]['content'].encode('utf-8'), # content
        lambda x: list(x['files'].keys())[0])  # file name

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
    requestcontext = Context(user, repo, path)
    gitrequest, token = githubrequest(user, repo, path)
    return finishrequest(requestcontext, 
        gitrequest, 
        token, 
        lambda x: base64.b64decode(x['content'].encode('utf-8')))


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
    name -- specific file name or gist id
    
    Returns URL to Github file or gist.
    """
    if user != '' and repo != '':
        retval = "https://github.com/{0}/{1}/blob/master/".format(user,repo)
    else:
        retval = "https://gist.github.com/"
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


