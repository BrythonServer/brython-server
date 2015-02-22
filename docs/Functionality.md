#Brython-Server Functional Specification

##Introduction

The Brython-Server project addresses difficulties encountered when teaching Python (and especially Python 3)
to high-school classes. Experience has shown that student engagement is maximized when the programming
assignments and projects have a *graphical* component. Unfortunately, as of 2014/2015, installing Python 3 
on multiple platforms, with a full graphical environment (such as Pygame) is extremely challenging. 

In addition, with the advent of cloud-based platforms, and many students carrying Google Chromebooks, the 
requirement of having a native IDE installed on every possible computing platform is becoming an 
unattainable ideal. 

The Brython-Server project addresses these issues by providing students with:

1. A browser-based environment ([Brython](http://brython.info)) for executing Python 3 code.
2. Support for browser-based development using an online IDE, such as [Cloud 9](c9.io).
3. Support for a graphical programming environment using 3rd party Javascript components 
   (e.g. [Pixi.js](www.pixijs.com)) for  in-browser graphics.
4. Support for native development using Python 3 and Pygame and/or Pyglet. 
5. Support for executing code online, from sources maintained in Github, for the purpose of 
   evaluating student work and sharing student work publically.

##Functionality - Overview

A Brython-Server instance will consist of a web site where the user can enter the URL of a Github 
project or repository (consisting of Python 3 sources). Brython-Server will retrieve the source files
from Github and return a web page with embedded links to the Brython distribution and the user's 
Python source. The web page will execute the user's code in the browser, interact via console output and 
input, and (optionally) create dynamic and interactive imagery via HTML5 canvas.

The main Brython-Server page (e.g. `http://brython-server.org`) presents the following elements to the visitor:

1. Text box labeled: "Execute Python 3 from URL"
2. Button labeled: "Execute Python 3 console"

The following sections describe these and other modes of operation in greater detail.

###Use Case: Github

Suppose the user has a Github repository with one or more Python 3 source files in it. The user may visit
the Brython-Server main page and paste the URL of the Github repository page in the text box. Brython-Server
will retrieve the list of top-level files from the repository and invoke the Brython interpreter on one of
them, using this priority scheme:

1. Execute the only file with a .py extension.
2. Execute the only file named `__main__.py`.
3. Execute the only file named `main.py`.

Enhancement option 1: Enhanced parsing of the Github URL to allow providing the URL of an individual file.
Enhancement option 2: Examine repository files for an `if __name__ == "__main__":` block and execute any 
file containing it.

When the visitor enters a Github URL in the textbox the page will reload with the following URL:

`http://brython-server.org/github/<username>/<repository>`

With the enhancement option 1 implemented, the following is also possible:

`http://brython-server.org/github/<username>/<repository>/<filename>`

Once execution of the chosen python source file is complete, the code may be re-loaded and executed
again by reloading the web page. The execution page will include the following elements:

1. Console input/output (input from console is implemented as a popup dialog).
2. Graphics canvas (if the application is graphical)
3. Error output
4. Link to main landing page (e.g. `http://brython-server.org`)

The user may reload and execute the code as often as desired. Note that there may be a delay of several seconds
after committing files on Github before the updates are available to execute.

It is expected that the typical user will **not** use Github as a development IDE. While Github has 
excellent online code editing support, the turnaround time from edit to execution is relatively slow. 

###Use Case: Cloud 9

Suppose the user is using Cloud 9 as an online IDE, with an active project containing one or more Python 3
source files. The user can "publish" the files by executing the `Apache httpd (HTML,PHP)` runner and pasting
the URL (of the form: `https://<projectname>-<username>.c9.io`) into the Brython-Server "Execute from URL" 
text box. Brython-Server will retrieve the file list from the URL (assuming there is no `index.html` in 
the project) and invoke the Brython interpreter using the same priority scheme outlined above for Github.

With this use case, the user/developer may invoke the Brython interpreter as often as desired by reloading
the Brython-Server home page. 

The advantage of the Cloud 9 use case over the Github use case is in the speed of iterating source code
changes. In order for source edits directly on Github to become live they must go through the Git commit
process. In order for source edits on Cloud 9 to become live they must merely be saved in the UI. 

It is *expected* that the user will ultimately push her Cloud 9 project files to a Github repository. 

Cloud 9 users have the option of executing console-based Python 3 code directly in the Cloud 9 
console window. When this option is feasible, it is preferred over using Brython-Server.

###Use Case: Python 3 Console

If the visitor clicks the "Console" button, then she will be taken to a fully interactive Python 3 shell.
There is no interaction between this shell and any files executed from Github or Cloud 9.

##Support for Python Features

The Python 3 feature set supported will track the features of the latest released version of Brython.
In addition, 

The main Python 3 source file may `import` the same standard libraries that Brython supports, in addition
to any other Python 3 modules provided by the user at the same level as the main file.

Goal: Resource files included at the same level are also available on a read-only basis. 
Goal: Some support for read and write file i/o on the client side; it should be impossible to write data 
on the server!

##Graphics Support





