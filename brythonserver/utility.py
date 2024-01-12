"""
Brython-Server utility functions for Github and session management
Author: E Dennison
"""

import os
import urllib
import json
import base64
import random
import string
from flask import session, url_for
from .definitions import (
    ENV_GITHUBCLIENTID,
    ENV_GITHUBSECRET,
    SESSION_GITHUBSTATE,
    URL_GITHUBAUTHORIZE,
    URL_GITHUBRETRIEVETOKEN,
    SESSION_METADATA,
    SESSION_ACCESSTOKEN,
)


def github_client_id():
    """Retrieve the Github Client ID."""
    return os.environ.get(ENV_GITHUBCLIENTID, "")


def github_client_secret():
    """Retriev the Github Client Secret."""
    return os.environ.get(ENV_GITHUBSECRET, "")


def newgithubstate():
    """Create new Github STATE for login

    Sets a random string as local session state for Github, if not
    already set.

    Return the state string
    """
    state = session.get(SESSION_GITHUBSTATE, "")
    if SESSION_GITHUBSTATE not in session:
        nchars = 20
        state = "".join(
            random.SystemRandom().choice(string.ascii_uppercase + string.digits)
            for _ in range(nchars)
        )
        session[SESSION_GITHUBSTATE] = state
    return state


def getredirecturl():
    """Construct a redirect URL for returning here from Github

    Return the redirect URL
    """
    url = url_for("root", _external=True)
    if url.endswith(":80"):
        url = url[:-3]
    return url


# Public functions


def checkgithubstate(state):
    """Verify correct Github STATE has been returned

    Return True if matching, False otherwise
    """
    return state == session.get(SESSION_GITHUBSTATE, "")


def githubauthurl():
    """Construct a redirect URL TO Github.

    Return the URL
    """
    url = URL_GITHUBAUTHORIZE + "?"
    url += "client_id=" + github_client_id()
    url += "&redirect_uri=" + getredirecturl()
    url += "&scope=repo gist&state=" + newgithubstate()
    print(url)
    return url


def githubretrievetoken(code):
    """Retrieve a user's access token from Github.

    Returns nothing
    """
    gitrequest = urllib.request.Request(URL_GITHUBRETRIEVETOKEN)
    gitrequest.add_header("Accept", "application/json")
    parameters = {
        "client_id": github_client_id(),
        "client_secret": github_client_secret(),
        "code": code,
        "redirect_uri": getredirecturl(),
    }
    data = urllib.parse.urlencode(parameters)
    data = data.encode("utf-8")
    with urllib.request.urlopen(gitrequest, data) as response:
        jsresponse = json.loads(response.read().decode("utf-8"))
        if "access_token" in jsresponse:
            session[SESSION_ACCESSTOKEN] = jsresponse.get("access_token")


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
    token = session.get(SESSION_ACCESSTOKEN)
    gitrequest = urllib.request.Request(url, method=method)
    gitrequest.add_header("Authorization", f"token {token}")
    gitrequest.add_header("User-Agent", "Brython-Server")
    return gitrequest, token


def finishrequest(gitrequest, retrievalmethod, metamethod=None):
    """Boilerplate for finishing the API request to Github

    Arguments:
    gitrequest -- request object
    token -- session token
    retrievalmethod -- function for extracting file contents from response
    metamethod -- optional function for extracting metadata from response

    Return tuple:
    binreturn - the resource data
    sha - the resource SHA
    """
    jsresponse = sha = None
    try:
        with urllib.request.urlopen(gitrequest) as response:
            jsresponse = json.loads(response.read().decode("utf-8"))
            sha = jsresponse.get("sha", "")
    except urllib.error.HTTPError as err:
        if err.code != 304:  # Not Modified - use earlier jsresponse
            raise
    binreturn = retrievalmethod(jsresponse)
    session[SESSION_METADATA] = metamethod(jsresponse) if metamethod else ""

    try:
        return binreturn.decode("utf-8"), sha
    except UnicodeDecodeError:
        return binreturn, sha


def gistrequest(gistid, method="GET"):
    """Initiate a request to the Github gist API.

    Arguments:
    gistid -- the hex identifier for the file
    method -- http mehthod (e.g. GET, etc.)  (Default is 'GET')

    Return tuple:
    gitrequest - the request object from urllib.request.Request
    token - the token being used in the request
    """
    url = f"https://api.github.com/gists/{gistid}"
    return finishrequestsetup(url, method)


def githubrequest(user, repo, path, method="GET"):
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
    url = f"https://api.github.com/repos/{user}/{repo}/contents/{path}"
    return finishrequestsetup(url, method)


def githubretrievegist(gistid):
    """Retrieve a gist from Github via API.

    Arguments:
    gistid -- hex string identifying a gist

    Return tuple:
    content -- the content of the specific file
    sha -- the file sha (used for subsequent commits, if any)
    """
    gitrequest, _token = gistrequest(gistid)
    return finishrequest(
        gitrequest,
        lambda x: x["files"][list(x["files"].keys())[0]]["content"].encode(
            "utf-8"
        ),  # content
        lambda x: list(x["files"].keys())[0],
    )  # file name


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

    def retrievalmethod(x):
        return base64.b64decode(x["content"].encode("utf-8"))

    gitrequest, _token = githubrequest(user, repo, path)
    return finishrequest(gitrequest, retrievalmethod)


def githubgetmainfile(user, repo, path):
    """Retrieve the 'main' Python file from a repo/directory. Function
    attempts to make a sensible decision.

    Arguments:
    user -- the Github user ID/name
    repo -- the Github user's repository name
    path -- specific directory path within the repo

    Return: the name of the file
    """
    jsresponse = None
    gitrequest, _token = githubrequest(user, repo, path)
    with urllib.request.urlopen(gitrequest) as response:
        jsresponse = json.loads(response.read().decode("utf-8"))
        names = [f["name"] for f in filter(lambda x: x["type"] == "file", jsresponse)]
        return selectmainfile(names)


def githubpath(user, repo, branch, path, name):
    """Build a valid URL to file on Github.

    Note: This is sensitive to changes in how Github URLs work.

    Arguments:
    user -- the Github user ID/name
    repo -- the Github user's repository name
    branch -- specific branch name (typ. master or main)
    path -- specific path to file within the repo
    name -- specific file name or gist id

    Returns URL to Github file or gist.
    """
    if user != "" and repo != "":
        retval = f"https://github.com/{format}/{repo}/blob/{branch}/"
    else:
        retval = "https://gist.github.com/"
    if path:
        retval += path
        if name not in path:
            retval += "/" + name
    else:
        retval += name
    return retval


def githubloggedin():
    """Return whether we are logged in to Github (True/False)."""
    github_token = session.get(SESSION_ACCESSTOKEN)
    return github_token


def selectmainfile(names):
    """Determine 'main' python file from a list of candidates.

    Arguments:
    names -- a list of candidate names
    Return: the best candidate name
    """
    mainfile = ""
    for foundname in names:
        if (
            mainfile == ""
            and len(foundname) > 3
            and foundname[-3:] == ".py"
            or
            # Foud a python file called main.py or __main__.py? Make IT the one!
            foundname in ["main.py", "__main__.py"]
        ):
            mainfile = foundname
    return mainfile
