![build passing](https://github.com/BrythonServer/brython-server/actions/workflows/build-and-test.yml/badge.svg?event=push)

# Brython-Server

**Brython-Server** is a Flask-based web application focused on providing a simple
Python 3 development environment where source files are hosted on Github.

You can try [Brython-Server](http://runpython.org)
to get a feel for how it works.

## Brief Instructions

When the page loads, you can begin writing Python 3 code right away. To 
execute your code, press the **run** button.

### Github Support
To load Python 3 source code hosted on Github, you must should first log in to
Github with the **login** button. Github will ask you to authorize Brython-Server
in the next page. 

To load your source, paste the Github URL of your source file or repository 
into the text control at the top of the page. Press `<Enter>` or the **refresh** 
button to retrieve the source from Github.

You may make any changes you want to the source code and re-run it. If you would
like to save your work back to Github, just press the **commit** button.

### Google Drive Support
The Google Drive **load** and **save** buttons will activate Google Drive 
authentication and authorization dialog where you may confirm your desire to let
Brython-Server access your Google Drive. This confirmation is required periodically.

The Google Drive **load** button directs you to a standard Google Drive file picking
screen. Only compatible text files are available to pick. Once you have selected a file,
the URL for the file will be displayed in the upper left edit window.

The Google Drive **save** button will upload any changes you have made to a file since
you downloaded it, but only if you own or have edit priveleges on the file. If you didn't
download a file first, the **save** button will prompt you for a new file name. 
In this case, Brython-Server will create a new file with your chosen name in the root
of your Google Drive.

If you previously **load**-ed or refreshed an existing file from Google Drive then the
**save** button will simply udate your file with any changes you have made since then.

Authorizing Google Drive will also add the Brython-Server app to your Google Drive.
This will give you a custom **new** file type in Google Drive, and a custom option
under the Google Drive **Open with** context menu.

Note: files that were not created by Brython-Server may not be opened from the **load**
button unless you previously opened them with the Google Drive **Open with** context
menu.

Note: working with any Github repository or Google Drive source files will require you
to have an account with these services. If you use these services to access files
that are not modifiable by you, you will be able to edit them locally in the
Brython-Server page but will not be able to commit or save any changes back to their
original source unless you have the priveleges to do so.

### Turtle

Brython-Server supports the Python turtle to the extent that it is supported by
the underlying Brython interpreter. Its usage is simple, but slightly non-standard.
For example:

```python
from brythonserver import turtle
t = turtle.Turtle()
t.forward(100)
t.right(90)
t.forward(100)
turtle.done()
```

### Ggame

Brython-Server includes built-in support for the Ggame graphics engine. For example,
a trivial program from the 
[Ggame documentation](https://ggame.readthedocs.io/en/latest/introduction.html):

```python
from ggame import App, ImageAsset, Sprite

# Create a displayed object at 100,100 using an image asset
Sprite(ImageAsset("bunny.png"), (100, 100))
# Create the app, with a default stage
APP = App()
# Run the app
APP.run()
```

## Deployment

The best way to install Brython-Server is with pip and virtualenv, using Python 3.11+. 
Create and activate your virtual environment then install Brython-Server with:


```python
python3.11 -m pip install brython-server
```

### Requirements

The essential requirements for Brython-Server are met when you install with pip.
In addition, for a production install you will need 
[gunicorn](http://docs.gunicorn.org/en/stable/install.html).

Brython-Server will use [Brython](https://github.com/brython-dev/brython) as
its Python interpreter and and [Ggame](https://github.com/BrythonServer/ggame) 
as its graphics engine. The correct versions of each will automatically be used
when you install Brython-Server using pip.

### Environment Variables

A full Brython-Server installation that is capable of interacting with Github
should have several environment variables set for production use:

Required for Github functionality:
* githubtoken  (an optional Github personal access token)
* githubsecret (Github oauth secret)
* githubclientid (Github oauth client id)

Required for Google Drive functionality:
* googleclientid (Google Client ID)
* googleapikey (Google API Key. Brython Server requires the drive/files 
  and filePicker APIs)
* googleappid (Google Application ID)

Required for creating a "personalized" Brython-Server instance:
* sitetitle (A string that will be displayed as the "name of the site")
* sitecontact (An e-mail address to use for contact)
* siteurl (A full URL to the website)
* flasksecret (A Flask application secret key)

Note: to generate a unique, random Flask secret key, enter the following in
a Python console:


```python
>>> import os
>>> os.urandom(24)
```

Use the string that results as the value of the flasksecret environment 
variable.

### Execution

To run the server in stand-alone development mode (never in production!) 
execute (for example) from the Python 3 shell:

```python
Python 3.11.7 (main, Dec  8 2023, 18:56:58) [GCC 11.4.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> from brythonserver.main import APP
>>> APP.run(host="0.0.0.0", port=8080)
 * Serving Flask app 'brythonserver.main' (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on all addresses (0.0.0.0)
   WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://127.0.0.1:8080
 * Running on http://192.168.111.50:8080 (Press CTRL+C to quit)
 ```
 
To run the server in a production environment, use gunicorn:

```bash
$ gunicorn -b 0.0.0.0:3000 -w 4   brythonserver.main:APP
```
## Development Environment

To begin working with Brython Server in development environment:

* Clone this repository and cd into it.
* Create a virtual environment: `python3.11 -m venv env`
* Activate the virtual environment: `source env/bin/activate`
* Install the dependencies: `python3.11 -m pip install -r requirements.txt`

### Other Dependencies

Your development environment will need black and standardjs to 
execute the `run_tests` and `run_js_tests` scripts (in the scripts folder).

### Execution

Prior to executing the server in your development environment you will have to 
perform the following manual steps to populate the Brython distribution files
where Brython Server can access them:

```bash
cd ~/workspace/brython-server
mkdir -p brythonserver/static/brython
cd brythonserver/static/brython
python3.11 -m brython --update

```

Now you should be able to run Brython Server in your development environment 
using a script similar to this:

```bash
export githubclientid=<insert your github client id here>
export githubsecret=<insert your github secret here>
export githubtoken=<insert your personal github token here>
export googleclientid='<insert your google client id here>.apps.googleusercontent.com'
export googleapikey='<insert your google api key here>'
export googleappid='<insert your google app id here>'
export sitetitle="<insert the name of your development site here>"
export sitecontact=<insert an e-mail address here>
export siteurl=<insert the url for your development page here>
export PORT=<use your port number here>
source brython-server/env/bin/activate
cd brython-server
python3.11 -m pip install -r requirements.txt
pushd brythonserver/static/brython
brython-cli install
popd
python3.11 wsgi.py
```



