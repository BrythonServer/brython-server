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
ENV_BRYTHON_VERSION = "brythonversion"

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

GGAME_USER = "BrythonServer"
GGAME_DEV_USER = "tiggerntatie"  # for development only
GGAME_REPOSITORY = "ggame"
GGAME_VERSION_NAME = "VERSION"
GGAME_BUZZ_VERSION_NAME = "BUZZ_VERSION"
GGAME_PIXI_VERSION_NAME = "PIXI_VERSION"
GGAME_BUZZ_VERSION_DEFAULT = "1.1.10"
GGAME_PIXI_VERSION_DEFAULT = "3.0.11"

BRYTHON_FOLDER = "static/brython"
BRYTHON_VERSION = "3.7.3"
