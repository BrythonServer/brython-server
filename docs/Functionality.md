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

The main Brython-Server page presents the following elements to the visitor:

1. Text box labeled: "Execute Python 3 from URL"
2. Button labeled: "Execute Python 3 console"

The following sections describe these and other modes of operation in greater detail.

###Use Case: Github

Suppose the user has a Github repository with one or more Python 3 source files in it. The user may visit
the Brython-Server main page and paste the URL of the Github repository page in the text box. Brython-Server
will retrieve the list of top-level files from the repository and invoke the Brython interpreter on one of
them, using this priority scheme:

1. Execute the only file with a .py extension.
2. Execute the only file named __main__.py.
3. Execute the only file named main.py.

Enhancement option 1: Enhanced parsing of the Github URL to allow providing the URL of an individual file.
Enhancement option 2: Examine repository files for an `if __name__ == "__main__":` block and execute any 
file containing it.


