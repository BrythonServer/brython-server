#Brython-Server Functional Specification

##Introduction

The Brython-Server project addresses difficulties encountered when teaching Python (and especially Python 3) to high-school classes. Experience has shown that student engagement is maximized when the programming assignments and projects have a *graphical* component. Unfortunately, as of 2014/2015, installing Python 3 on multiple platforms, with a full graphical environment (such as Pygame) is extremely challenging. 

In addition, with the advent of cloud-based platforms, and many students carrying Google Chromebooks, the requirement of having a native IDE installed on every possible computing platform is becoming an unattainable ideal. 

The Brython-Server project addresses these issues by providing students with:

1. A browser-based environment ([Brython](http://brython.info)) for executing Python 3 code.
2. Support for browser-based development using an online IDE, such as [Cloud 9](c9.io).
3. Support for a graphical programming environment using 3rd party Javascript components 
   (e.g. [Pixi.js](www.pixijs.com)) for  in-browser graphics.
4. Support for native development using Python 3 and Pygame and/or Pyglet. 
5. Support for executing code online, from sources maintained in Github, for the purpose of 
   evaluating student work and sharing student work publically.

##Functionality - Overview

A Brython-Server instance will consist of a web site where the user can enter the URL of a Github project or repository (consisting of Python 3 sources). Brython-Server will retrieve the source files from Github and return a web page with embedded links to the Brython distribution and the user's Python source. The web page will execute the user's code in the browser, interact via console output and input, and (optionally) create dynamic and interactive imagery via HTML5 canvas.

The main Brython-Server page (e.g. `http://brython-server.org`) presents the following elements to the visitor:

1. Text box labeled: "Execute Python 3 from URL"
2. Button labeled: "Execute Python 3 console"

The following sections describe these and other modes of operation in greater detail.

###Use Case: Github

Suppose the user has a Github repository with one or more Python 3 source files in it. The user may visit the Brython-Server main page and paste the URL of the Github repository page in the text box. Brython-Server will retrieve the list of top-level files from the repository and invoke the Brython interpreter on one of them, using this priority scheme:

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

Once execution of the chosen python source file is complete, the code may be re-loaded and executed again by reloading the web page. The execution page will include the following elements:

1. Console input/output (input from console is implemented as a popup dialog).
2. Graphics canvas (if the application is graphical)
3. Error output
4. Link to main landing page (e.g. `http://brython-server.org`)

The user may reload and execute the code as often as desired. Note that there may be a delay of several seconds after committing files on Github before the updates are available to execute.

It is expected that the typical user will **not** use Github as a development IDE. While Github has excellent online code editing support, the turnaround time from edit to execution is relatively slow. 

This approach should only work for **public** Github repositories. If the user wishes to execute from **private** repositories, then the user would have to grant Brython-Server permission to access her repositories. Ability to access private repositories is a **GOAL** of this project.

###Use Case: Cloud 9

Suppose the user is using Cloud 9 as an online IDE, with an active project containing one or more Python 3 source files. The user can "publish" the files by executing the `Apache httpd (HTML,PHP)` runner and pasting the URL (of the form: `https://<projectname>-<username>.c9.io`) into the Brython-Server "Execute from URL" text box. Brython-Server will retrieve the file list from the URL (assuming there is no `index.html` in the project) and invoke the Brython interpreter using the same priority scheme outlined above for Github.

With this use case, the user/developer may invoke the Brython interpreter as often as desired by reloading the Brython-Server home page. 

The advantage of the Cloud 9 use case over the Github use case is in the speed of iterating source code changes. In order for source edits directly on Github to become live they must go through the Git commit process. In order for source edits on Cloud 9 to become live they must merely be saved in the UI. 

It is *expected* that the user will ultimately push her Cloud 9 project files to a Github repository. 

Cloud 9 users have the option of executing console-based Python 3 code directly in the Cloud 9 console window. When this option is feasible, it is preferred over using Brython-Server.

###Use Case: Python 3 Console

If the visitor clicks the "Console" button, then she will be taken to a fully interactive Python 3 shell. There is no interaction between this shell and any files executed from Github or Cloud 9.

##Support for Python Features

The Python 3 feature set supported will track the features of the latest released version of Brython.

The main Python 3 source file may `import` the same standard libraries that Brython supports, in addition to any other Python 3 modules provided by the user at the same level as the main file.

Goal: Resource files included at the same level are also available on a read-only basis. 

Goal: Some support for read and write file i/o on the client side; it should be impossible to write data 
on the server!

##Graphics Support

A key requirement of this system is support for graphics and user keyboard/mouse interaction with executing python code, similar to the functionality possible with Pygame. Brython supports the same basic functionality for working with the HTML 5 Canvas that is present in Javascript. In addition, Brython supports interaction with 3rd party graphics libraries (e.g. [Pixi.js](www.pixijs.com)). Unfortunately, the APIs available in the browser are very different from what is available in native desktop Python installations. Consequently, this project will implement a simple graphics abstraction layer that will sit between the underlying  graphics APIs and the user code. The abstraction layer will be in the form of a single Python 3 module that the user may import and use in either the Brython-Server environment, or a desktop environment.

The abstraction module/layer will be called **actorgraphics** (notional name).

###actorgraphics

The actorgraphics module will be a single Python 3 module, which will autodect its environment and provide simple graphics and UI services from an available underlying graphics/UI library. In the web environment, this could be provided, in part, for example by [paper.js](paperjs.org) or [Pixi.js](www.pixijs.com). In the desktop environment this could be provided at minimum by Tkinter (required), Pyglet or Pygame (goal). **Minimum** functionality implemented by actorgraphics include:

1. Event driven architecture.
2. Timed callbacks.
3. Keyboard, mouse movement and button events handled at application level.
4. Single window application.
5. Window background color or bitmap.
6. Sprite "actor" class.
7. Built in sprite types support bitmap, rectangle, ellipse and polygon.
8. Built in sprite attributes (set/get) include visibility, color, bitmap, position and rotation.
9. Built in sprite methods include collision detection.
10. Goal: sound file playback.
11. Goal: turtle graphics functions: pen functionality associated with sprites.

The actorgraphics module is not automatically available to programs executed by Brython-Server. It may be available to the user as a download from the Brython-Server landing page. 

User programs that depend on the actorgraphics module may be executed in either the desktop or Brython-Server environment, and will exhibit similar behavior in each. If the user program is executed in a so-called headless environment where no underlying graphics support is available, then it will execute normally, but will not be able to respond to mouse events. It *may* be possible to respond to keypress events in any environment. Supporting operation in a headless environment will permit some unit testing of user code that depends on graphics.

##Appendix: Use in Educational Setting

Although outside the scope of this functional specification, it seems worthwhile to briefly discuss how Brython-Server might be integrated in to the educational setting as part of an introductory course on computer programming.

We envision using Brython-Server in concert with Github. The instructor would create a repository of assignments, or a collection of assignment repositories,which each student would clone in to her own account. With each assignment there is a corresponding automated test defined, which the student is expected to run to validate her work. When each assignment is complete, the student would make a pull request to the assignment repository, whereupon the instructor would run the requisite test, evaluate the code, and provide feedback and a formal assessment (grade).

At any time, teacher or student may use Brython-Server to execute the submitted code, provided the Github repository is public. Ability to access private repositories is a goal of this project. It is assumed that the instructor is *not* limited to cloud-based devices and will be able to evaluate code using a native Python 3 interpreter and graphics installation.

With Brython-Server the student also has the option of sharing her work with friends, by sharing the Brython-Server Github URL for her repository. Again, the repository must be public for this to work.

Up to this point, nothing in this appendix *depends* on the existence of Brython-Server. However, with increasing use of Chromebooks in the classroom, many students will find it inconvenient to install native Python 3 and graphics libraries on their own devices. For these students, a cloud-based IDE like Cloud 9 is a viable alternative. 

With a Cloud 9 workspace, students can freely develop and test Python 3 console applications. The actorgraphics module will not be useful, however, unless the student is able to test her code on a Brython-Server. Brython-Server and Cloud 9 will support this, if a little awkwardly. To run a Cloud 9 project on Brython-Server, the student would have to execute the `Apache httpd` runner, which will create a dedicated web server for serving her source code to the outside world. Passing the server URL to the Brython-Server will allow full execution with the actorgraphics module. The student would be expected to do development in the Cloud 9 environment, then commit and push her changes back to Github for formal testing and assessment.

