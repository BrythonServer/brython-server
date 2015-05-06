"""Brython-Server string constant definitions.
"""
from collections import namedtuple

ENV_GITHUBCLIENTID = 'githubclientid'
ENV_GITHUBSECRET = 'githubsecret'
ENV_DEVTOKEN = 'githubtoken'
ENV_FLASKSECRET = 'flasksecret'

SESSION_GITHUBSTATE = 'githubstate'
SESSION_ACCESSTOKEN = 'accesstoken'
SESSION_URLINPUT = 'urlinput'
SESSION_EDITCONTENT = 'editcontent'
SESSION_MAINFILE = 'mainfile'
SESSION_MAINSHA = 'mainsha'
SESSION_GITHUBCONTEXT = 'githubcontext'
SESSION_GITHUBREPO = 'githubrepo'
SESSION_GITHUBPATH = 'githubpath'

CACHE_TIMEOUT_S = 60*60*24  # One Day (how much to keep RAM usage under control?)

Context = namedtuple('Context', ['user', 'repo', 'path'])
Cachedata = namedtuple('Cachedata', ['contents','sha','etag'])

RUN_EDIT = 'run_edit'
AUTH_REQUEST = 'auth_request'
AUTH_FORGET = 'auth_forget'
GITHUB_COMMIT = 'github_commit'

URL_GITHUBAUTHORIZE = 'https://github.com/login/oauth/authorize'
URL_GITHUBRETRIEVETOKEN = 'https://github.com/login/oauth/access_token'
