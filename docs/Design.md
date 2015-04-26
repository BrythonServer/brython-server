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

Files available at this routing point exist internally as elements of a dictionary
stored as session data by Flask. Brython-Server overrides the default session
implementation (cookies) and uses a Redis backend for all session data. This
permits storage of arbitrarily large temporary files without using the host
file system directly. The session data is populated from sources on Github
as a result of the `load` API method (see next section).

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

The main web page has two flavors, determined by the html templates index.html and a exec.html, both of which are rendered from the root URL (`/`) of the server, depending on how it was used.

####`index.html`

This template is used when visiting the server root, and presents the visitor with a Python code editing pane on the
left hand side, drive by the Ace Javascript editor. The Python execution console is shown in a smaller right-hand pane.
The user may begin writing/editing code immediately and executing it by pressing the '>' button. When the '>' button 
is pressed the `brython` function is executed, naming the editor ID as an argument.

Once a file or project has been loaded from Github, this page will also show a 'SHARE' button which will, when
pressed, open a new tab/window using the `exec.html` template.

####`exec.html`

This template is used when visiting the server root with arguments in the URL to indicate a specific
Github user, repository and file path. In this instance, the Python execution console consumes a full width pane
on the page and the code is loaded from Github and executed without delay. The URL shown in this mode may be 
copied and pasted as a hyperlink on another page or in an e-mail (i.e. "shared").

In this instance a button is available which allows the user to edit the main file using the `index.html` template by 
opening a new window/tab.

###Deployment

Following are steps for deploying Brython-Server to a Linux host:

####Prerequisites

1. Use the system package manager to install Python 3. 
2. Follow these instructions to install [Redis](http://redis.io/topics/quickstart).

####Clone Brython-Server

Create a local copy of the Brython-Server sources:

    git clone https://github.com/tiggerntatie/brython-server.git

####Create Virtualenv

Create a virtual environment for the server:

    virtualenv brython-server

Note that this directory should not necessarily be within the Brython-Server source
tree, or vice versa. 

Activate your virtual environment:

    source brython-server/bin/activate

Then install the following dependencies using PIP:

1. flask
2. gunicorn
3. redis

Test the server locally by running:

    python main.py


####Configure for Automatic Startup

Create a startup script in `/etc/init`. For example: `/etc/init/brython-server.conf` with
the following contents:

    description "brython-server"
    start on (filesystem)
    stop on runlevel [016]
    
    env githubtoken=<Github developer token, if any>
    env githubsecret=<Github app secret token>
    env githubclientid=<Github app client ID>
    env flasksecret=<Flask session secret key>
    
    respawn
    setuid <system user to run as>
    setgid <system user to run as>
    chdir <path to virtualenv folder>
    
    exec <path to virtualenv gunicorn executable> -b <listen ip address>:<port> main:app

Text enclosed in `<>` brackets indicates information specific to your installation.

The `env` lines provide installation-specific secret information needed for Brython-Server
to operate properly. Do not archive this information (or this configuration file) with
your project source code.

In order to support Github integration, you will have to register a Github app. The callback 
URL for Brython-Server is its root URL `/`. Once registered, Github will provide you with 
a secret token and client ID. See the [Flask session documentation](http://flask.pocoo.org/docs/0.10/quickstart/) 
for information on creating a Flask session secret key.

With this file in place, you can start the server with:

    sudo start brython-server

####Use with NGINX

The gunicorn server can be the sole web server for this application, or you can use it with NGINX
via proxy. Configure your NGINX server thus:

    location /brython-server/ {    # <<< put the desired URL path here
              proxy_redirect     off;
              proxy_set_header   Host $host;
              proxy_set_header   X-Real-IP $remote_addr;
              proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header   X-Forwarded-Host $server_name;
              proxy_set_header   X-Scheme $scheme;
              proxy_set_header   X-Script-Name /brython-server;
              proxy_pass         http://127.0.0.1:<port>/;
          }

In this case, configure gunicorn to operate with ip address: `127.0.0.1` and the same port 
shown in the NGINX configuration.

