# Brython-Server

**Brython-Server** is a Flask-based web application focused on providing a simple
Python 3 development environment where source files are hosted on Github.

You can try [Brython-Server](http://runpython.com)
to get a feel for how it works.

## Brief Instructions

When the page loads, you can begin writing Python 3 code right away. To 
execute your code, press the **GO!** button.

To load Python 3 source code hosted on Github, you must should first log in to
Github with the **login** button. Github will ask you to authorize Brython-Server
in the next page. 

To load your source, paste the Github URL of your source file or repository 
into the text control at the top of the page. Press `<Enter>` or the **load** 
button to retrieve the source from Github.

You may make any changes you want to the source code and re-run it. If you would
like to save your work back to Github, just press the **commit** button.

## Deployment

The best way to install Brython-Server is with pip and virtualenv. Create and 
activate your virtual environment then install Brython-Server with:


```python
pip install brython-server
```

### Requirements

The essential requirements for Brython-Server are met when you install with pip.
In addition, you will need to install 
[memcached](https://memcached.org/downloads) and, for a production install, 
[gunicorn](http://docs.gunicorn.org/en/stable/install.html).

Brython-Server will use [Brython](https://github.com/brython-dev/brython) as
its Python interpreter and and [Ggame](https://github.com/BrythonServer/ggame) 
as its graphics engine. The correct versions of each will automatically be used
when you install Brython-Server using pip.

### Environment

A full Brython-Server installation that is capable of interacting with Github
should have several environment variables set for production use:

* githubtoken  (an optional Github personal access token)
* githubsecret (Github oauth secret)
* githubclientid (Github oauth client id)
* flasksecret (A Flask application secret key)
* sitename (A string that will be displayed as the "name of the site")

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

