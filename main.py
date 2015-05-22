"""Brython-Server main module with Flask route points.
"""
import os
import urllib.request, json, urllib.parse, base64
from flask import Flask, render_template, session, request, redirect, url_for, abort, Response
from reverseproxied import ReverseProxied
from redissessions import RedisSessionInterface
from definitions import *
from utility import *

application = app = Flask(__name__, static_url_path='/__static')
app.wsgi_app = ReverseProxied(app.wsgi_app)
app.session_interface = RedisSessionInterface()

app.secret_key = os.environ.get(ENV_FLASKSECRET,'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT')
app.debug = os.environ.get(ENV_DEBUG, False)

@app.route('/', methods=['POST', 'GET'])
def root():
    """Root server URL.
    
    This default path for the web site is used for a variety of things, 
    via voth POST and GET methods. 
    
    With GET, the URL may include an argument list, which is used to load 
    a particularl Github repository/file. This is useful for sharing code
    via e-mail or hyperlink. This URL/method is also used as a return
    URL from Github when the user authorizes the application. In this
    case the argument list includes a STATE and access TOKEN.
    
    With POST, the user has requested a switch to EDIT mode (from exec.html),
    or to login at Github or forget login at Github.
    
    Returns one of the following:
    index.html -- render template
    exec.html -- render template
    redirect -- to / or github
    """
    github_loggedin = githubloggedin()   
    sitename = os.environ.get(ENV_SITENAME, 'Brython Server')
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
                path=path,
                site=sitename)
        elif 'code' in request.args and 'state' in request.args:
            # Github authorization response - check if valid
            if checkgithubstate(request.args.get('state')):
                githubretrievetoken(request.args.get('code'))
            return redirect(url_for('root'))
        else:
            return render_template('index.html', 
                github = github_loggedin,
                site = sitename,
                edit = '',
                editcontent = INIT_CONTENT)
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
    """Return favicon.ico.
    
    Since web browsers are inclined to request the favicon.ico from the root
    of the web server, we should be able to provide it. Note that this will
    cause a problem if the Github python app has a resource called favicon.ico.
    """
    return app.send_static_file('favicon.ico') 


@app.route('/<path:filename>')
def file(filename):
    """Return cached file for the current Github repo.
    """
    try:
        cx = session[SESSION_GITHUBCONTEXT]
        content, sha = githubretrievefile(cx.user, cx.repo, cx.path + '/' + filename)
        if type(content) is bytes:
            return Response(content, mimetype='application/octet-stream')        
        else:
            return Response(content)
    except (FileNotFoundError, KeyError) as err:
        print(err)
        abort(404)
        


## API routes

@app.route('/api/v1/commit', methods=['PUT'])
def v1_commit():
    """Commit changes in editor to the current main file on Github.

    JSON arguments:
    user -- Github user name
    repo -- Github user's repo name
    path -- path (fragment) to a specific file
    name -- specific file name
    editcontent -- contents of editor on web page
    commitmsg -- commit message
    
    JSON return:
    success -- True/False
    """
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
    gitrequest, token = githubrequest(user, repo, path, 'PUT')
    gitrequest.add_header('Content-Type', 'application/json; charset=utf-8')
    gitrequest.add_header('Accept', 'application/json')
    parameters = {'message':msg,
        'content':base64.b64encode(editcontent.encode('utf-8')).decode('utf-8'),
        'sha':session[SESSION_MAINSHA]}
    data = json.dumps(parameters).encode('utf-8')
    gitrequest.add_header('Content-Length', len(data))
    try:
        response = urllib.request.urlopen(gitrequest, data)
        jsresponse = json.loads(response.read().decode("utf-8"))
        session[SESSION_MAINSHA] = jsresponse['content']['sha']
        print("Github commit OK")
        return json.dumps({'success':True}, 200, {'ContentType':'application/json'})
    except urllib.error.HTTPError as err:
        print("Github commit error: " + err.msg + " " + str(err.code) + ", token was ", token, ", path was ", user, repo, path)
        return json.dumps({'success':False, 'message':err.msg}), 200, {'ContentType':'application/json'} 


@app.route('/api/v1/load', methods=['PUT'])
def v1_load():
    """Load source code and resources from Github

    JSON arguments:
    user -- Github user name
    repo -- Github user's repo name
    path -- optional path (fragment) to a specific file
    name -- optional specific file name
    
    JSON return:
    success -- True/False
    name -- name of main file to execute
    path -- path to main file 
    content -- content of main file
    """
    content = request.json
    user = content.get('user')
    repo = content.get('repo')
    path = content.get('path','')
    name = content.get('name','')
    mainfile = name
    mainsha = ""
    
    try:
        if mainfile == '':
            mainfile = githubgetmainfile(user, repo, path)
        if mainfile != '':
            maincontent, mainsha = githubretrievefile(user, repo, path + '/' + mainfile)
            # All files read, save primary name and sha
            session[SESSION_MAINFILE] = mainfile
            session[SESSION_MAINSHA] = mainsha
            session['test'] = 'yelp'
            session[SESSION_GITHUBCONTEXT] = Context(user, repo, path)
            # All files read, return 
            return json.dumps({'success':True, 
                        'name':mainfile, 
                        'path':githubpath(user,repo,path,mainfile),
                        'content':maincontent}), 200, {'ContentType':'application/json'}
        else:
            raise FileNotFoundError
    except (urllib.error.HTTPError, FileNotFoundError) as err:
        print("Github error: " + err.msg + ", path was ", user, repo, path)
        return json.dumps({'success':False, 'message':err.msg}), 200, {'ContentType':'application/json'} 




if __name__ == "__main__":
    app.run(host=os.environ['IP'],port=int(os.environ['PORT']))
