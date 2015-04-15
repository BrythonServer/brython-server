import os, shutil
import tempfile, urllib.request, json
from flask import Flask, render_template, session, request
from reverseproxied import ReverseProxied

application = app = Flask(__name__)
app.wsgi_app = ReverseProxied(app.wsgi_app)

# change this, of course!
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'
app.debug = True


def newtempdir():
    if 'tempdir' in session:
        try:
            shutil.rmtree(tempdir())
        except:
            pass
    session['tempdir'] = tempfile.mkdtemp()

def tempdir():
    return session['tempdir']

# Root path
# If GET with repo data, use the exec.html template
# If GET with nothing, plain old index.html 
# Otherwise, if POST, index.html with pre-populated github path
@app.route('/', methods=['POST', 'GET'])
def root():
    if request.method == 'GET':
        if 'user' in request.args:
            user = request.args.get('user')
            repo = request.args.get('repo')
            name = request.args.get('name')
            path = request.args.get('path','')
            return render_template('exec.html', user=user, repo=repo, name=name, path=path)
        else:
            return render_template('index.html', edit='')
    elif request.method == 'POST':
        return render_template('index.html', edit=request.form['run_edit'])

        
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
## NOTE: This must scan the full path even if a specific file is indicated,
## otherwise the temp cache will not be correctly built.
@app.route('/api/v1/load', methods=['PUT'])
def v1_load():
    content = request.json
    user = content['user']
    repo = content['repo']
    path = ""
    if 'path' in content:
        path = content['path']
    name = ""
    if 'name' in content:
        name = content['name']
    mainfile = ""
    newtempdir()
    url = "https://api.github.com/repos/{0}/{1}/contents/{2}".format(user, repo, path)
    token = os.environ['githubtoken']
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

