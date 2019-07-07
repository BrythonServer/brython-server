"""
Brython-Server string constant definitions.
Author: E Dennison
"""

from collections import namedtuple

ENV_GITHUBCLIENTID = "githubclientid"
ENV_GITHUBSECRET = "githubsecret"
ENV_DEVTOKEN = "githubtoken"
ENV_FLASKSECRET = "flasksecret"
ENV_SITENAME = "sitename"
ENV_DEBUG = "debug"
ENV_ADVERTISEMENT = "advertisement"

SESSION_GITHUBSTATE = "githubstate"
SESSION_ACCESSTOKEN = "accesstoken"
SESSION_MAINFILE = "mainfile"
SESSION_MAINSHA = "mainsha"
SESSION_GITHUBCONTEXT = "githubcontext"
SESSION_GITHUBREPO = "githubrepo"
SESSION_GITHUBPATH = "githubpath"
SESSION_METADATA = "metadata"

CACHE_TIMEOUT_S = 60 * 60 * 24  # One Day (how much to keep RAM usage under control?)
CACHE_VERSION = "1"
Context = namedtuple("Context", ["user", "repo", "path"])
Cachedata = namedtuple("Cachedata", ["contents", "sha", "etag"])

RUN_EDIT = "run_edit"
AUTH_REQUEST = "auth_request"
AUTH_FORGET = "auth_forget"
GITHUB_COMMIT = "github_commit"
IMPORTNAME = "brythonserver"

URL_GITHUBAUTHORIZE = "https://github.com/login/oauth/authorize"
URL_GITHUBRETRIEVETOKEN = "https://github.com/login/oauth/access_token"

INIT_CONTENT = 'print("Hello, world.")'

BRYTHON_FOLDER = "static/brython"
BRYTHON_JS = "brython.js"
