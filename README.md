# Brython-Server

**Brython-Server** is a Flask-based web application focused on providing a simple
Python 3 development environment where source files are hosted on Github.

You can try [Brython-Server](http://runpython.com)
to get a feel for how it works.

## Brief Instructions

When the page loads, you can begin writing Python 3 code right away. To 
execute your code, press the **GO!** button.

### Github Support
To load Python 3 source code hosted on Github, you must should first log in to
Github with the **login** button. Github will ask you to authorize Brython-Server
in the next page. 

To load your source, paste the Github URL of your source file or repository 
into the text control at the top of the page. Press `<Enter>` or the **load** 
button to retrieve the source from Github.

You may make any changes you want to the source code and re-run it. If you would
like to save your work back to Github, just press the **commit** button.

### Google Drive Support
To load Python 3 source code stored in your Google Drive account, you first have
to give Brython-Server permission to access your account by pressing the 
**authorize** button with the Google Drive logo on it. Once you have logged in to
your Google account and given Brython-Server (or the website that runs on 
Brython-Server) permission to access your Drive files, you will have Google Drive 
a **load** and **save** buttons.

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

Note: you may access (but not modify) any public Github or Google Drive Python source file without
logging in to Github, Google, or creating an account. You *can* edit the source file locally
in your browser but will not be able to commit any changes unless you are logged in
and have priveleges to do so.

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

The best way to install Brython-Server is with pip and virtualenv. Create and 
activate your virtual environment then install Brython-Server with:


```python
pip install brython-server
```

### Requirements

The essential requirements for Brython-Server are met when you install with pip.
In addition, you will need to install 
[redis](https://redis.io/download) and, for a production install, 
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

Required for connecting to a non-standard Redis instance:
* redishost (An IP address)
* redisport (The port number)

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
Python 3.7.0 (default, Oct  4 2018, 21:19:26)
[GCC 5.4.0 20160609] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> from brythonserver.main import APP
Update Brython scripts to verion 3.7.3
>>> APP.run(host="0.0.0.0", port=3000)
 * Serving Flask app "brythonserver.main" (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://0.0.0.0:3000/ (Press CTRL+C to quit)
 ```
 
To run the server in a production environment, use gunicorn:

```bash
$ gunicorn -b 0.0.0.0:3000 -w 4   brythonserver.main:APP
```

