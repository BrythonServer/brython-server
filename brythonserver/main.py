"""
Brython-Server main module with Flask route points.
Author: E Dennison
"""
import os
import os.path
import urllib.request
import urllib.parse
import json
import base64
import re
import redis
from flask import (
    Flask,
    render_template,
    session,
    request,
    redirect,
    url_for,
    abort,
    Response,
)
from flask_session import Session
from flask_caching import Cache
import ggame.__version__
from ggame.__version__ import VERSION as GGVERSION, BUZZ_VERSION, PIXI_VERSION
from .reverseproxied import ReverseProxied
from .definitions import (
    ENV_FLASKSECRET,
    ENV_DEBUG,
    ENV_GOOGLECLIENTID,
    ENV_GOOGLEAPIKEY,
    ENV_GOOGLEAPPID,
    BRYTHON_FOLDER,
    BRYTHON_JS,
    ENV_SITETITLE,
    ENV_SITECONTACT,
    ENV_SITEURL,
    INIT_CONTENT,
    RUN_EDIT,
    AUTH_REQUEST,
    AUTH_FORGET,
    IMPORTNAME,
    SESSION_GITHUBCONTEXT,
    SESSION_MAINSHA,
    SESSION_MAINFILE,
    SESSION_METADATA,
    REDIS_HOST,
    REDIS_PORT,
    Context,
)
from .utility import (
    githubloggedin,
    checkgithubstate,
    gistrequest,
    githubretrievetoken,
    githubretrievefile,
    githubauthurl,
    githubforgetauth,
    githubgetmainfile,
    githubretrievegist,
    githubpath,
    githubrequest,
)
from .__version__ import VERSION

APP = Flask(__name__, static_url_path="/__static")
APP.wsgi_app = ReverseProxied(APP.wsgi_app)

APP.secret_key = os.environ.get(ENV_FLASKSECRET, "A0Zr98j/3yX R~XHH!jmN]LWX/,?RT")
APP.debug = os.environ.get(ENV_DEBUG, False)

# Use memcached for session data

APP.config["SESSION_TYPE"] = "redis"
APP.config["SESSION_REDIS"] = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
Session(APP)

# Use memcached for memoizing view functions
APP.config["CACHE_TYPE"] = "redis"
APP.config["CACHE_REDIS_HOST"] = REDIS_HOST
APP.config["CACHE_REDIS_PORT"] = REDIS_PORT
CACHE = Cache(APP)

# Retrieve Brython Version
with open(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), BRYTHON_FOLDER, BRYTHON_JS)
) as bjs:
    BRYTHON_VERSION = re.search('__BRYTHON__.__MAGIC__.*=.*"(.+)"', bjs.read()).group(1)

# Locate the ggame directory
GGAME_PATH = os.path.dirname(os.path.abspath(ggame.__version__.__file__))

SITETITLE = os.environ.get(ENV_SITETITLE, "Brython Server")
SITECONTACT = os.environ.get(ENV_SITECONTACT, "noone@nowhere.net")
SITEURL = os.environ.get(ENV_SITEURL, "https://runpython.org")
G_CLIENTID = os.environ.get(ENV_GOOGLECLIENTID, "")
G_APIKEY = os.environ.get(ENV_GOOGLEAPIKEY, "")
G_APPID = os.environ.get(ENV_GOOGLEAPPID, "")


@APP.route("/", methods=["POST", "GET"])
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
    cookieconsent = request.cookies.get("cookie_consent") == "true"

    github_loggedin = githubloggedin()

    returnedhtml = None

    if request.method == "GET":
        if "user" in request.args or "gist" in request.args or "fileid" in request.args:
            # Executing an existing file
            user = request.args.get("user", "")
            repo = request.args.get("repo", "")
            name = request.args.get("name", request.args.get("gist", ""))
            path = request.args.get("path", "")
            fileid = request.args.get("fileid", "")
            returnedhtml = render_template(
                "exec.html",
                user=user,
                repo=repo,
                name=name,
                path=path,
                fileid=fileid,
                title=SITETITLE,
                contact=SITECONTACT,
                brythonversion=BRYTHON_VERSION,
                buzzversion=BUZZ_VERSION,
                pixiversion=PIXI_VERSION,
                bsversion=VERSION,
                ggversion=GGVERSION,
                cookieconsent=cookieconsent,
                g_clientid=G_CLIENTID,
                g_apikey=G_APIKEY,
                g_appid=G_APPID,
            )
        elif "code" in request.args and "state" in request.args:
            # Github authorization response - check if valid
            if checkgithubstate(request.args.get("state")):
                githubretrievetoken(request.args.get("code"))
            returnedhtml = redirect(url_for("root"))
        elif "gui_edit" in request.args:
            # Drive UI integration: Edit
            returnedhtml = render_template(
                "index.html",
                edit=request.args.get("gui_edit", ""),
                new="",
                title=SITETITLE,
                contact=SITECONTACT,
                consolesite=SITETITLE + " Console",
                editcontent="",
                github=github_loggedin,
                brythonversion=BRYTHON_VERSION,
                buzzversion=BUZZ_VERSION,
                pixiversion=PIXI_VERSION,
                bsversion=VERSION,
                ggversion=GGVERSION,
                cookieconsent=cookieconsent,
                g_clientid=G_CLIENTID,
                g_apikey=G_APIKEY,
                g_appid=G_APPID,
            )
        elif "gui_new" in request.args:
            # Drive UI integration: New
            returnedhtml = render_template(
                "index.html",
                edit="",
                new=request.args.get("gui_new", ""),
                title=SITETITLE,
                contact=SITECONTACT,
                consolesite=SITETITLE + " Console",
                editcontent="",
                github=github_loggedin,
                brythonversion=BRYTHON_VERSION,
                buzzversion=BUZZ_VERSION,
                pixiversion=PIXI_VERSION,
                bsversion=VERSION,
                ggversion=GGVERSION,
                cookieconsent=cookieconsent,
                g_clientid=G_CLIENTID,
                g_apikey=G_APIKEY,
                g_appid=G_APPID,
            )
        else:
            # Nothing special going on
            returnedhtml = render_template(
                "index.html",
                github=github_loggedin,
                title=SITETITLE,
                contact=SITECONTACT,
                consolesite=SITETITLE + " Console",
                edit="",
                new="",
                editcontent=INIT_CONTENT,
                brythonversion=BRYTHON_VERSION,
                buzzversion=BUZZ_VERSION,
                pixiversion=PIXI_VERSION,
                bsversion=VERSION,
                ggversion=GGVERSION,
                cookieconsent=cookieconsent,
                g_clientid=G_CLIENTID,
                g_apikey=G_APIKEY,
                g_appid=G_APPID,
            )
    elif request.method == "POST":
        if RUN_EDIT in request.form:
            # user is requesting to open a new page with editor
            returnedhtml = render_template(
                "index.html",
                edit=request.form[RUN_EDIT],
                new="",
                title=SITETITLE,
                contact=SITECONTACT,
                consolesite=SITETITLE + " Console",
                editcontent="",
                github=github_loggedin,
                brythonversion=BRYTHON_VERSION,
                buzzversion=BUZZ_VERSION,
                pixiversion=PIXI_VERSION,
                bsversion=VERSION,
                ggversion=GGVERSION,
                cookieconsent=cookieconsent,
                g_clientid=G_CLIENTID,
                g_apikey=G_APIKEY,
                g_appid=G_APPID,
            )
        elif AUTH_REQUEST in request.form:
            # user is requesting authorization from github
            returnedhtml = redirect(githubauthurl())
        elif AUTH_FORGET in request.form:
            # user is requesting to forget our authorization
            githubforgetauth()
            returnedhtml = redirect(url_for("root"))
    if returnedhtml:
        return returnedhtml
    abort(404)
    return "You should never see this!"


@APP.route("/favicon.ico")
def favicon():
    """Return favicon.ico.

    Since web browsers are inclined to request the favicon.ico from the root
    of the web server, we should be able to provide it. Note that this will
    cause a problem if the Github python app has a resource called favicon.ico.
    """
    return APP.send_static_file("favicon.ico")


@APP.route("/brythonconsole")
def brythonconsole():
    """Return template for python/brython console.
    """
    cookieconsent = request.cookies.get("cookie_consent") == "true"
    return render_template(
        "console.html",
        title=SITETITLE,
        contact=SITECONTACT,
        consolesite=SITETITLE + " Console",
        brythonversion=BRYTHON_VERSION,
        bsversion=VERSION,
        cookieconsent=cookieconsent,
    )


@APP.route("/" + IMPORTNAME + "/<filename>")
def brythonimport(filename):
    """Return static import file

    Add custom importable modules under the static/IMPORTNAME folder.
    """
    return APP.send_static_file(os.path.join(IMPORTNAME, filename))


@APP.route("/legalnotices/<filename>")
def legalnotices(filename):
    """Return legal notice html
    """
    return render_template(
        filename + ".html", title=SITETITLE, contact=SITECONTACT, url=SITEURL
    )


@APP.route("/ggame/<path:filename>")
@CACHE.cached(timeout=60)
def ggameimport(filename):
    """Return content from the ggame file tree."""
    try:
        with open(os.path.join(GGAME_PATH, filename), "rb") as thefile:
            content = thefile.read()
        if isinstance(content, bytes):
            return Response(content, mimetype="application/octet-stream")
        return Response(content)
    except (FileNotFoundError) as err:
        print(err)
        abort(404)
    return "You should never see this!"


@APP.route("/ggame.py")
@CACHE.cached(timeout=600)
def ggame_py():
    """Return a 404 on any attempt to load ggame.py. This is will
    avoid 'wasting time' before searching for modules in the
    ggame package."""
    # ggame is an available package, no ggame.py will be possible
    abort(404)


@APP.route("/<path:filename>")
def file(filename):
    """Return (possibly cached) file for the current Github repo.
    Will look for png match in the local ggame installation as well!
    """
    filename = urllib.request.pathname2url(filename)
    try:
        cx = session[SESSION_GITHUBCONTEXT]
        content, _sha = githubretrievefile(cx.user, cx.repo, cx.path + "/" + filename)
    except (FileNotFoundError, KeyError, urllib.error.HTTPError) as err:
        try:
            if not filename.endswith((".png", ".PNG")):
                raise FileNotFoundError
            return ggameimport(filename)
        except (FileNotFoundError) as err:
            print(err)
            abort(404)
    if isinstance(content, bytes):
        return Response(content, mimetype="application/octet-stream")
    return Response(content)


## API routes


@APP.route("/api/v1/commit", methods=["PUT"])
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
    user = content.get("user")
    repo = content.get("repo")
    path = content.get("path", "")
    name = content.get("name", "")
    editcontent = content.get("editcontent", "")
    msg = content.get("commitmsg", "")
    if path and not path.endswith(name):
        path += "/" + name
    else:
        path += name
    try:
        metadata = session.get(SESSION_METADATA, "")  # previously loaded a gist?
        if metadata == "":  # default - ordinary repository
            gitrequest, token = githubrequest(user, repo, path, "PUT")
            parameters = {
                "message": msg,
                "content": base64.b64encode(editcontent.encode("utf-8")).decode(
                    "utf-8"
                ),
                "sha": session[SESSION_MAINSHA],
            }
        else:  # this is a gist file name
            gitrequest, token = gistrequest(name, "PATCH")
            parameters = {"files": {metadata: {"content": editcontent}}}
    # pylint: disable=bare-except
    except:
        print("Session expired.")
        return (
            json.dumps(
                {"success": False, "message": "Session expired - reload to continue"}
            ),
            440,
            {"ContentType": "application/json"},
        )
    data = json.dumps(parameters).encode("utf-8")
    gitrequest.add_header("Content-Type", "application/json; charset=utf-8")
    gitrequest.add_header("Accept", "application/json")
    gitrequest.add_header("Content-Length", len(data))
    try:
        response = urllib.request.urlopen(gitrequest, data)
        jsresponse = json.loads(response.read().decode("utf-8"))
        session[SESSION_MAINSHA] = jsresponse.get("content", {}).get("sha", "")
        return (json.dumps({"success": True}), 200, {"ContentType": "application/json"})
    except urllib.error.HTTPError as err:
        error = err.msg + " " + str(err.code)
        print(
            "Github commit error: " + error + ", token was ",
            token,
            ", path was ",
            user,
            repo,
            path,
        )
        return (
            json.dumps({"success": False, "message": error}),
            404,
            {"ContentType": "application/json"},
        )


@APP.route("/api/v1/load", methods=["PUT"])
def v1_load():
    """Load source code and resources from Github

    JSON arguments:
    user -- Github user name (blank for gist)
    repo -- Github user's repo name (blank for gist)
    branch -- optional branch identifier
    path -- optional path (fragment) to a specific file
    name -- optional specific file name or gist ID

    JSON return:
    success -- True/False
    name -- name of main file to execute
    path -- path to main file
    content -- content of main file
    """
    content = request.json
    user = content.get("user", "")
    repo = content.get("repo", "")
    branch = content.get("branch", "")
    path = content.get("path", "")
    name = content.get("name", "")
    mainfile = name
    mainsha = ""
    try:
        if mainfile == "":
            mainfile = githubgetmainfile(user, repo, path)
        else:
            if user != "" and repo != "":  # user, repo, path and mainfile
                maincontent, mainsha = githubretrievefile(
                    user, repo, path + "/" + mainfile
                )
            elif user == "" or repo == "":  # missing user or repo -> must be gist?
                maincontent, mainsha = githubretrievegist(mainfile)
            else:
                raise FileNotFoundError
            # All files read, save primary name and sha
            session[SESSION_MAINFILE] = mainfile
            session[SESSION_MAINSHA] = mainsha
            session[SESSION_GITHUBCONTEXT] = Context(user, repo, path)
            # All files read, return
            return (
                json.dumps(
                    {
                        "success": True,
                        "name": mainfile,
                        "path": githubpath(user, repo, branch, path, mainfile),
                        "content": maincontent,
                    }
                ),
                200,
                {"ContentType": "application/json"},
            )
    except (urllib.error.HTTPError, FileNotFoundError) as err:
        print("Github error: " + err.msg + ", path was ", user, repo, path)
        return (
            json.dumps({"success": False, "message": err.msg}),
            404,
            {"ContentType": "application/json"},
        )
    return (
        json.dumps({"success": False, "message": "You should not see this error."}),
        404,
        {"ContentType": "application/json"},
    )
