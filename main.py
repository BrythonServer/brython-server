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

@app.route('/')
def root():
  return render_template('index.html', main=None)

@app.route('/<filename>')
def file(filename):
    with open(os.path.join(tempdir(),filename)) as f:
        return f.read()


# Note to self:
# Modifiy these handlers to cache the *method* of use: cloud9 or github
# Then only handle retrieval of the *main* file, rendering index.html
# Then subsequent calls to the /<filename> route will automatically
# Retrieve directly from github or cloud9
@app.route('/cloud9/<user>/<project>')
@app.route('/cloud9/<user>/<project>/<path>')
def gocloud9(user, project, path=""):
    newtempdir()
    url = "https://{0}-{1}.c9.io/{2}".format(project, user, path)
    urllib.request.urlcleanup()
    

@app.route('/github/<user>/<repo>')
@app.route('/github/<user>/<repo>/<path>')
def gogithub(user, repo, path=""):
    # print(request.url)  # DEBUG
    mainfile = ""
    newtempdir()
    url = "https://api.github.com/repos/{0}/{1}/contents/{2}".format(user, repo, path)
    token = os.environ['githubtoken']
    urllib.request.urlcleanup()
    gitrequest = urllib.request.Request(url)
    gitrequest.add_header('Authorization', 'token {0}'.format(token))
    # print(url) # DEBUG
    try:
        response = urllib.request.urlopen(gitrequest)
        #print(response.getheaders())
        jsresponse = json.loads(response.read().decode("utf-8"))
        for f in jsresponse:
            if f['type'] == 'file':
                name = f['name']
                if mainfile == "" and len(name) > 3 and name[-3:] == '.py':
                    mainfile = name
                if name in ["main.py", "__main__.py"]:
                    mainfile = name
                fileurl = f['download_url']
                gitrequest = urllib.request.Request(fileurl)
                gitrequest.add_header('Authorization', 'token {0}'.format(token))
                rfile = urllib.request.urlopen(gitrequest)
                with open(os.path.join(tempdir(), name), 'w') as f:
                    f.write(rfile.read().decode("utf-8"))
        return render_template('run.html', main=mainfile, root=request.script_root)
    except urllib.error.HTTPError as err:
        print("Github error: " + err.msg + ", token was ", token)
        return "Oops. Something went wrong with github..."
    

if __name__ == "__main__":
    app.run(host=os.environ['IP'],port=int(os.environ['PORT']))

