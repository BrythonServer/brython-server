import os, shutil, string, random
import tempfile, urllib.request, json, urllib.parse, base64
from flask import Flask, render_template, session, request, redirect, url_for
from reverseproxied import ReverseProxied

application = app = Flask(__name__)
app.wsgi_app = ReverseProxied(app.wsgi_app)


ENV_GITHUBCLIENTID = 'githubclientid'
ENV_GITHUBSECRET = 'githubsecret'
ENV_DEVTOKEN = 'githubtoken'
ENV_FLASKSECRET = 'flasksecret'

SESSION_TEMPDIR = 'tempdir'
SESSION_GITHUBSTATE = 'githubstate'
SESSION_ACCESSTOKEN = 'accesstoken'
SESSION_URLINPUT = 'urlinput'
SESSION_EDITCONTENT = 'editcontent'
SESSION_MAINFILE = 'mainfile'
SESSION_MAINSHA = 'mainsha'

RUN_EDIT = 'run_edit'
AUTH_REQUEST = 'auth_request'
AUTH_FORGET = 'auth_forget'
GITHUB_COMMIT = 'github_commit'

URL_GITHUBAUTHORIZE = 'https://github.com/login/oauth/authorize'
URL_GITHUBRETRIEVETOKEN = 'https://github.com/login/oauth/access_token'

github_client_id = os.environ[ENV_GITHUBCLIENTID]
github_client_secret = os.environ[ENV_GITHUBSECRET]
app.secret_key = os.environ.get(ENV_FLASKSECRET,'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT')
app.debug = True

def newtempdir():
    if SESSION_TEMPDIR in session:
        try:
            shutil.rmtree(tempdir())
        except:
            pass
    session[SESSION_TEMPDIR] = tempfile.mkdtemp()

def tempdir():
    return session[SESSION_TEMPDIR]


# newgithubstate
# Set a random string as local session state for github, if not
# already set
def newgithubstate():
    state = session.get(SESSION_GITHUBSTATE, '')
    if SESSION_GITHUBSTATE not in session:
        N = 20
        state = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(N))
        session[SESSION_GITHUBSTATE] = state
    return state
    
# checkgithubstate
# return True if state matches, otherwise False
def checkgithubstate(state):
    return state == session.get(SESSION_GITHUBSTATE, '')

# getredirecturl
# Return URL to redirect to from github
# Needs some scrubbing to put in acceptible format
def getredirecturl():
    url = url_for('root', _external=True)
    if url.endswith(":80"):
        url = url[:-3]
    return url

# githubauthurl
# generate a redirect URL to github
def githubauthurl():
    #print(url_for('root', _external=True))
    url = URL_GITHUBAUTHORIZE + "?"
    url += "client_id="+github_client_id
    url += "&redirect_uri="+getredirecturl()
    url += "&scope=repo&state="+newgithubstate()
    print(url)
    return url

# githubretrievetoken
# retrieve an access token for the user via URL_GITHUBRETRIEVETOKEN
def githubretrievetoken(code):
    gitrequest = urllib.request.Request(URL_GITHUBRETRIEVETOKEN)
    gitrequest.add_header('Accept', 'application/json')
    parameters = {'client_id':github_client_id,
        'client_secret':github_client_secret,
        'code':code,
        'redirect_uri':getredirecturl()}
    data = urllib.parse.urlencode(parameters)
    data = data.encode('utf-8')
    response = urllib.request.urlopen(gitrequest, data)
    jsresponse = json.loads(response.read().decode("utf-8"))
    if 'access_token' in jsresponse:
        session[SESSION_ACCESSTOKEN] = jsresponse.get('access_token')
    
# githubforgetauth
# forget the current github authorization
def githubforgetauth():
    session[SESSION_ACCESSTOKEN] = ""


# Root path
# If GET with repo data, use the exec.html template
# If GET with nothing, plain old index.html 
# Otherwise, if POST, index.html with pre-populated github path
@app.route('/', methods=['POST', 'GET'])
def root():
    github_token = session.get(SESSION_ACCESSTOKEN)
    github_loggedin = True if github_token else False    
    if request.method == 'GET':
        if 'user' in request.args:
            user = request.args.get('user')
            repo = request.args.get('repo')
            name = request.args.get('name')
            path = request.args.get('path','')
            return render_template('exec.html', 
                user=user, 
                repo=repo, 
                name=name, 
                path=path)
        elif 'code' in request.args and 'state' in request.args:
            # Github authorization response - check if valid
            if checkgithubstate(request.args.get('state')):
                githubretrievetoken(request.args.get('code'))
            return redirect(url_for('root'))
        else:
            return render_template('index.html', 
                edit=session.get(SESSION_URLINPUT,''), 
                editcontent = session.get(SESSION_EDITCONTENT,'print("Hello, world.")'),
                github = github_loggedin)
    elif request.method == 'POST':
        if RUN_EDIT in request.form:
            # user is requesting to open a new page with editor
            return render_template('index.html', 
                edit=request.form[RUN_EDIT], 
                editcontent = '',
                github = github_loggedin)
        elif AUTH_REQUEST in request.form:
            # user is requesting authorization from github
            return redirect(githubauthurl())
        elif AUTH_FORGET in request.form:
            # user is requesting to forget our authorization
            githubforgetauth()
            return redirect(url_for('root'))

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico') 

@app.route('/_debug')
def debug():
    return render_template('test.html')

# Default handler for any single file name: these are pulled
# from the Python source temporary cache folder
@app.route('/<filename>')
def file(filename):
    with open(os.path.join(tempdir(),filename)) as f:
        return f.read()

# Build a valid github URL out of user, repo, path and name
# Perhaps there is a github API for doing this that will be more 
# stable?
def githubpath(user, repo, path, name):
    retval = "https://github.com/{0}/{1}/blob/master/".format(user,repo)
    if path:
        retval += path
        if name not in path:
            retval +=  "/" + name
    else:
        retval += name
    return retval

## /api/v1/update
##
## Inform server of edits/updates to the editor content and url_input
## Server will cache the content in session data and recover it
## when the page is reloaded.
@app.route('/api/v1/update', methods=['PUT'])
def v1_update():
    content = request.json
    session[SESSION_EDITCONTENT] = content.get('editcontent','')
    session[SESSION_URLINPUT] = content.get('url_input','')
    return json.dumps({'success':True}, 200, {'ContentType':'application/json'})

## /api/v1/commit
##
## Server will issue a commit to github
@app.route('/api/v1/commit', methods=['PUT'])
def v1_commit():
    content = request.json
    content = request.json
    user = content.get('user')
    repo = content.get('repo')
    path = content.get('path','')
    name = content.get('name','')
    editcontent = content.get('editcontent','')
    msg = content.get('commitmsg','')
    if path and not path.endswith(name):
        path += "/" + name
    else:
        path += name
    url = "https://api.github.com/repos/{0}/{1}/contents/{2}".format(user, repo, path)
    token = session.get(SESSION_ACCESSTOKEN)
    # formulate the call to github
    gitrequest = urllib.request.Request(url, method='PUT')
    gitrequest.add_header('Content-Type', 'application/json; charset=utf-8')
    gitrequest.add_header('Accept', 'application/json')
    gitrequest.add_header('Authorization', 'token {0}'.format(token))
    parameters = {'message':msg,
        'content':base64.b64encode(editcontent.encode('utf-8')).decode('utf-8'),
        'sha':session[SESSION_MAINSHA]}
    data = json.dumps(parameters).encode('utf-8')
    gitrequest.add_header('Content-Length', len(data))
    try:
        response = urllib.request.urlopen(gitrequest, data)
        jsresponse = json.loads(response.read().decode("utf-8"))
        return json.dumps({'success':True}, 200, {'ContentType':'application/json'})
    except urllib.error.HTTPError as err:
        print("Github error: " + err.msg + " " + str(err.code) + ", token was ", token)
        return json.dumps({'success':False, 'message':err.msg}), 200, {'ContentType':'application/json'} 

## /api/v1/load
##
## Retrieve specified user/repo/path from Github
## and cache the file and any other files in its directory
## Return the primary file name and content
## If given a path or root folder, will attempt to identify a single
## python file as the main file to execute.
## Input/json: user, repo, path, name (of file)
## Output/json: full github URL (path), file (name), content
##
## Function is too big..
@app.route('/api/v1/load', methods=['PUT'])
def v1_load():
    content = request.json
    user = content.get('user')
    repo = content.get('repo')
    path = content.get('path','')
    name = content.get('name','')
    mainfile = ""
    mainsha = ""
    newtempdir()
    url = "https://api.github.com/repos/{0}/{1}/contents/{2}".format(user, repo, path)
    token = session.get(SESSION_ACCESSTOKEN, os.environ.get(ENV_DEVTOKEN))
    # token = os.environ[ENV_DEVTOKEN]
    urllib.request.urlcleanup()
    gitrequest = urllib.request.Request(url)
    gitrequest.add_header('Authorization', 'token {0}'.format(token))
    try:
        maincontent = ""
        response = urllib.request.urlopen(gitrequest)
        jsresponse = json.loads(response.read().decode("utf-8"))
        if 'size' in jsresponse:        # if response is a single file
            jsresponse = [jsresponse]   # make a list of it
        for f in jsresponse:
            if f['type'] == 'file':
                ismain = False
                foundname = f['name']
                # First python file found? Make it THE ONE!
                if (mainfile == "" and len(foundname) > 3 and foundname[-3:] == '.py' or
                    # Foud a python file called main.py or __main__.py? Make IT the one!
                    foundname in ["main.py", "__main__.py"] or
                # Found a python file that the user actually wanted? Make IT THE ONE!
                    foundname == name):
                    mainfile = foundname
                    mainsha = f['sha']
                    ismain = True
                fileurl = f['download_url']
                # Read each file in the directory, regardless...
                gitrequest = urllib.request.Request(fileurl)
                gitrequest.add_header('Authorization', 'token {0}'.format(token))
                gitrequest.add_header('Pragma', 'no-cache')
                rfile = urllib.request.urlopen(gitrequest)
                with open(os.path.join(tempdir(), foundname), 'w') as f:
                    temp = rfile.read().decode("utf-8")
                    f.write(temp)
                    # If this is THE file, hold on to the content
                    if ismain:
                        maincontent = temp
        # All files read, save primary name and sha
        session[SESSION_MAINFILE] = mainfile
        session[SESSION_MAINSHA] = mainsha
        # All files read, return 
        return json.dumps({'success':True, 
                    'name':mainfile, 
                    'path':githubpath(user,repo,path,mainfile),
                    'content':maincontent}), 200, {'ContentType':'application/json'}
    except urllib.error.HTTPError as err:
        print("Github error: " + err.msg + ", token was ", token)
        return json.dumps({'success':False, 'message':err.msg}), 200, {'ContentType':'application/json'} 


## Execute specific script from github
## Input user, repo, filename, path fragment (not including file name)
@app.route('/_exec/<user>/<repo>/<name>/<path:path>/')
@app.route('/_exec/<user>/<repo>/<name>/')
def exec_github(user, repo, name, path=""):
    return render_template('exec.html', user=user, repo=repo, name=name, path=path)
    

if __name__ == "__main__":
    app.run(host=os.environ['IP'],port=int(os.environ['PORT']))

