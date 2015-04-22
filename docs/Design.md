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

