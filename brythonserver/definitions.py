"""
Brython-Server string constant definitions.
Author: E Dennison
"""

from collections import namedtuple
import os
import redis

ENV_GITHUBCLIENTID = "githubclientid"
ENV_GITHUBSECRET = "githubsecret"
ENV_DEVTOKEN = "githubtoken"
ENV_GOOGLECLIENTID = "googleclientid"
ENV_GOOGLEAPIKEY = "googleapikey"
ENV_GOOGLEAPPID = "googleappid"
ENV_FLASKSECRET = "flasksecret"
ENV_SITETITLE = "sitetitle"
ENV_SITECONTACT = "sitecontact"
ENV_SITEURL = "siteurl"
ENV_DEBUG = "debug"
ENV_REDIS_HOST = "redishost"
ENV_REDIS_PORT = "redisport"

SESSION_GITHUBSTATE = "githubstate"
SESSION_ACCESSTOKEN = "accesstoken"
SESSION_MAINFILE = "mainfile"
SESSION_MAINSHA = "mainsha"
SESSION_GITHUBCONTEXT = "githubcontext"
SESSION_GITHUBREPO = "githubrepo"
SESSION_GITHUBPATH = "githubpath"
SESSION_METADATA = "metadata"

CACHE_VERSION = "2"
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

REDIS_HOST = os.environ.get(ENV_REDIS_HOST, "0.0.0.0")
REDIS_PORT = os.environ.get(ENV_REDIS_PORT, "6379")

CACHE_CLIENT = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
CACHE_TIMEOUT_S = 60 * 60 * 24
