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

#### `/api/v1/<method>  (POST, PUT, GET)`

The server responds to several API URLs. These are used to communicate directly with the
client side, using JSON as the encoding method.

`method`  | Description   | Allowed Methods | Data Input  | Data Output
---       | ---           | ---             | ---         | ---
`load`    | Load and cache file(s) from the named Github repository | POST | (JSON) user, repo, {path or path fragment} | (JSON) name {main file name}, path {main file path}, content {main file content}



The client parses the user-provided Github URL to identify the user, repo and optional partial or full
path to a specific file or sub-folder. The `load` command will cause the server side to retrieve the 
contents of the named folder/path and cache the files locally.

In the process of caching, the server will attempt to identify a single Python source file that will
be loaded into the Brython-Server editor. The name of this file, the path to it, and the file's full
content will be returned to the caller.

