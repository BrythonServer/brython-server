# Brython-Server Design Specification

## Architecture

### Server Side Routes

The Brython-Server server side is built using the Python-based Flask application framework, running under
Python 3. The server will provide the following main entry points:

#### `/`

Main landing page, presents the user with blank edit and console windows, a Github URL text box, "LOAD", ">" and "LOGIN"
buttons. This URL is also for used with any mode in which Python code is executing under Brython. This is required
in order for any imported files to be correctly referenced using the `/<file>` path. This particular URL will be
described in more detail in another section.

#### `/static/<file>`

Path for retrieving static content, including CSS files and any client-side scripts required. 

#### `/favicon.ico`

Path for retrieving the site favicon file.

#### `/<file>` 

Path for retrieving any imported files required for the main executing Python file. No support currently provided
for files outside of the main source file's root folder. Support for imported files or resources for the main
Python file are only provided in the context of executing from a Github repository or file.

The files available at this routing point exist internally as files in a per-session temporary folder on the server,
which has been populated from sources on Github as a result of the `load` API method (see next section).

#### `/api/v1/<method>  (POST, PUT, GET)`

The server responds to several API URLs. These are used to communicate directly with the
client side, using JSON as the encoding method.

`method`  | Description   | Allowed Methods | Data Input (JSON)  | Data Output (JSON)
---       | ---           | ---             | ---         | --- 
`load`    | Load and cache file(s) from the named Github repository. Identify single main file, return its name and content. | POST | `user`, `repo`, `path` {optional path fragment}, `name` {optional main file name} | `name` {main file name}, `path` {main file path}, `content` {main file content}, `success` {true/false}
`update`  | Notify server of changes to the main file being edited in the browser. Prevents user losing work if they accidentally close the tab. | POST  | `editcontent` {current editor content}, `url_input` {current github pasted URL} | `success` {true/false} 
`commit`  | Commit main file changes made by the user to the originating Github file. | PUT   | `user`, `repo`, `path` {path fragment}, `name` {main file name}, `editcontent` {current editor content}, `commitmsg` {message to use for Github commit} | `success` {true/false} 

### Server Github Integration

The server side handles all interaction with Github, via the Github V3 API.

If the user is not authenticated with Github, then authentication with the Github API uses the Brython-Server
developer token, which allows up to 5000 transactions per hour, *globally*. In this situation, the user may modifiy code 
shown in their browser, and execute it, but will not be able to commit any modifications back to Github.

The user may press the 'LOGIN' button on the Brython-Server page, which will redirect to a Github login page. Github
will then ask the user if they wish to authorize Brython-Server to have read/write access to their private 
repositories. If the user approves, Github will return to Brython server with an authorization token for the 
session. All subsequent Github interactions with Brython-Server, during the user's browser session, will be
authorized with this custom token. While logged in the user is subject to their own 5000 transaction per hour
limitation.

While the user is logged in to Github, there will be a 'LOG OUT' button provided on the Brython-Server web page.
When the user presses 'LOG OUT', the user's session will forget its access token and will not be able to make 
further commits to any Github repository. If the user wishes to log back in, they will immediately be issued
a new access token, provided they are still have a session active with the Github web site.

### Client Side

The Brython-Server client side system consists of a single Javascript include, which is loaded with the
Brython-Server web page.

The principal responsibility of the client side code is to provide communication with the Brython-Server
server side API (`load`, `update` and `commit`), described earlier. In addition, there is code for dynamically 
enabling the different buttons and links that the user is able to access, depending on their current login state
and whether they have loaded any code from Github. Finally, there are routines that "hijack" the browser's 
alert and prompt functions in Javascript, re-routing text to a console textarea on the browser page.

The main web page has two flavors, an index.html and a exec.html, both of which are rendered from the root URL
of the server, depending on how it was used.

