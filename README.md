# Brython-Server

**Brython-Server** is a Flask-based web application focused on providing a simple
Python 3 development environment where source files are hosted on Github.

You can try a [development version of Brython-Server](http://runpython.com)
to get a feel for how it works.

## Brief Instructions

When the page loads, you can begin writing Python 3 code right away. To 
execute your code, press the **>** button.

To load Python 3 source code hosted on Github, you must should first log in to
Github with the **LOGIN** button. Github will ask you to authorize Brython-Server
in the next page. 

To load your source, paste the Github URL of your source file or repository 
into the text control at the top of the page. Press `<Enter>` or the **LOAD** 
button to retrieve the source from Github.

You may make any changes you want to the source code and re-run it. If you would
like to save your work back to Github, just press the **COMMIT** button.

NOTE: If you paste in a repository URL that points to multiple Python 3
source files, Brython-Server will make a feeble attempt to identify a primary
source file. If you want to force a specific file, then past the URL to that 
specific file.

## Deployment

See [these instructions](https://github.com/tiggerntatie/brython-server/blob/master/docs/Design.md#deployment)
for deploying Brython-Server to a Linux web server.
