# Brython-Server Design Specification

## Architecture

### Server Side

The Brython-Server server side is built using the Python-based Flask application framework, running under
Python 3. The server will provide the following main entry points:

#### `/`

Main landing page, presents the user with blank edit and console windows, a Github URL text box, "LOAD", ">" and "LOGIN"
buttons. This URL is also for used with any mode in which Python code is executing under Brython. This is required
in order for any imported files to be correctly referenced using the `/<file>` path. This particular URL will be
described in more detail in another section.

#### `/static/<file>`

Path for retrieving static content, including CSS files and any client-side scripts required. **ISSUE**: If future 
support is provided for full directory support of imports and resource files, a conflict may arise with the 
`static` name, if the name is used for a project subdirectory. In this case, investigate renaming `static` to 
`_static`.

#### `/favicon.ico`

Path for retrieving the site favicon file.

#### `/<file>` 

Path for retrieving any imported files required for the main executing Python file. No support currently provided
for files outside of the main source file's root folder. Support for imported files or resources for the main
Python file are only provided in the context of executing from a Github repository or file.

#### `/api/v1/<method>  (POST, PUT, GET)`

APIs required for communicating between the web client and this server are provided via JSON data
transfer. These APIs will be described in greater detail in another section.

#### `/?user=<githubuser>&repo=<githubrepo>&name=<mainfilename>`

Execute Brython Server immediately using the given username, repo and Python 3 source file.

## Basic Operation

### With Github

When a user visits the server, they may specify a github URL that identifies a repository or 
file within a repository. The repository should have at least one Python source file. When the 
"Load/Exec" button is pressed, the repository is scanned and all files are retrieved and cached
locally on the brython-server machine for the duration of the user's session.

Code may be edited and re-executed on the site. An option to update/commit the code back to
Github is a goal of the project and will require authorization with Github.

### Stand Alone

When a user visits the server, they may begin editing a source "file" using the code editor
on the main page. The code may be executed at any time and is cached on the server under the name
"__main__.py". Code created in this way can not be saved or shared via URL.

URLS

#### Stand alone execution

    /exec/<user>/<repo>[/<file>]

Load and execute specified file(s), using full browser window for output (text or graphical).

This URL entry point is valuable as a way of sharing and linking to specific python
repositories on Github. 

    /edit/<user>/<repo>[/<file>]

Load specified file(s), using edit and output panes. Do not execute. Redirect to /.

#### Retrieve file

    /<file>

If a session is active, this will return the cached copy of the file named. 


#### Interactive 

Typical use case:

1. User visits brython-server (e.g. http://brython-server.org)
2. User pastes github repo URL into textbox and clicks "Load/Exec" button.
3. Source appears in left hand pane and program output appears in right hand pane
4. If a graphical program, a new window pops with canvas.
5. Share and Edit links available for distribution. The Share link is the exec 
   version that will allow visitors to simply execute the program. The Edit link
   will give a visitor their own editor and output panes.

####RESTful API

URL             |   /api/v1/load
---             |   ---
Description     |   Load and cache file(s) from the named Github repository
Allowed Methods |   POST
Data Input      |   user, repo, [path]
Data Output     |   name {main file name}, path {main file path}, content {main file content}

