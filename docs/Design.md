Now a working document to play around with design strategies. This document will become
the actual design specfication for brython-server.

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
Data Output     |   name {main file name}, content {main file content}

