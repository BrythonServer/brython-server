#Brython-Server Functional Specification

##Introduction

The Brython-Server project addresses difficulties encountered when teaching Python (and especially Python 3) to high-school classes. Experience has shown that student engagement is maximized when the programming assignments and projects have a *graphical* component. Unfortunately, as of 2014/2015, installing Python 3 on multiple platforms, with a full graphical environment (such as Pygame) is extremely challenging. 

In addition, with the advent of cloud-based platforms, and many students carrying Google Chromebooks, the requirement of having a native IDE installed on every possible computing platform is becoming an unattainable ideal. 

The Brython-Server project addresses these issues by providing students with:

1. A browser-based environment ([Brython](http://brython.info)) for executing Python 3 code.
2. Support for a graphical programming environment using 3rd party Javascript components 
   (e.g. [Pixi.js](www.pixijs.com)) for  in-browser graphics.
3. Support for native development using Python 3 and Pygame and/or Pyglet. 
4. Support for executing code online, from sources maintained in Github, for the purpose of 
   evaluating student work and sharing student work publically.
5. Support for editing/revising Github repository code online, and committing directly to Github.

##Functionality - Overview

A Brython-Server instance will consist of a web site where the user can enter the URL of a Github repository 
(consisting of Python 3 sources) or individual source file within a repository. Brython-Server will retrieve 
the source file (and any included files) from Github and return a web page with embedded links to the Brython 
distribution and the user's Python source. The web page will execute the user's code in the browser, interact 
via console output and input, and (optionally) create dynamic and interactive imagery via HTML5 canvas.

The main Brython-Server page (e.g. `http://hsscp.org/brython-server`) presents the following elements to the visitor:

1. Text box with placeholder text suggesting the user paste a Github repository URL.
2. Text box for editing Python source code.
3. Button for loading source from Github.
4. Button for executing source.
5. Button for sharing the project as a hyperlink.
6. Button for linking to a Github user and signing in.
7. Button for unlinking from the Github user.

The following sections describe these and other modes of operation in greater detail.

###Use Case: Interactive Edit and Execute

Upon arriving at the main Brython-Server page, the user may begin editing code immediately. Code may be executed
at any time by pressing the execute, ">" button. Output will be displayed in separate console I/O text box. It is a goal
of the project to support the ACE online code editor for this functionality. No support is envisioned for loading or 
saving source code to the user's local machine.

###Use Case: Github

Suppose the user has a Github repository with one or more Python 3 source files in it. The user may visit the Brython-Server main page and paste the URL of the Github repository page in the text box. Brython-Server will retrieve the list of top-level files from the repository and invoke the Brython interpreter on one of them, using this priority scheme:

1. Execute the only file with a .py extension.
2. Execute the only file named `__main__.py`.
3. Execute the only file named `main.py`.

If the user pastes the Github URL for a specific file in the repository, then Brython-Server will retrieve that file
as the primary file to execute. Other files in the repository may be named as imports.

Once execution of the chosen python source file is complete, the code may be re-loaded by pressing
the "load" button again. Code may be executed as many times as desired, using the ">" button.

With code loaded, the page shall display at least the following elements:

1. Text indicating what file is executing (e.g. Executing __main__.py from https://github.com/tiggerntatie/brython-student-test)
2. Console input/output (input from console is implemented as a default browsesr prompt/popup dialog).
3. Graphics canvas (if the application is graphical).
4. Error output (included in the console display).

The user may reload and execute the code as often as desired. 

It is expected that the typical user will **not** use Github as a development IDE. While Github has excellent online code editing support, the turnaround time from edit to execution is relatively slow. 

This approach will work for **public** Github repositories. If the user wishes to execute from **private** repositories, then the user would have to grant Brython-Server permission to access their repositories. 

With access granted (via the "LOG IN" 
button), the user may edit the loaded source code directly, execute, and, if desired, **commit the code back to Github** (via
the "COMMIT" button). The "COMMIT" button is only available when the user has logged in to Github. Commit message will default
to indicating a commit from Brython Server, with the date and time of the commit.

####Sharing Projects

When working with a Github repository, the Brython-Server page will include a "SHARE" button that links back to 
Brython-Server with URL parameters to specify the user, repository and source file. For example:

    http://hhscp.org/brython-server/?user=tiggerntatie&repo=brython-student-test&name=loopdemo.py

This link may be shared via e-mail, etc., to allow anyone with a modern browser to execute the Python source file
using Brython-Server.

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

We envision using Brython-Server in concert with Github. The instructor would create a repository of assignments, or a collection of assignment repositories,which each student would clone in to her own account. With each assignment there is a corresponding automated test defined, which the student is expected to run to validate their work. When each assignment is complete, the student would make a pull request to the assignment repository, whereupon the instructor would run the requisite test, evaluate the code, and provide feedback and a formal assessment (grade).

At any time, teacher or student may use Brython-Server to execute the submitted code, provided the Github repository is public. Ability to access private repositories is a goal of this project. It is assumed that the instructor is *not* limited to cloud-based devices and will be able to evaluate code using a native Python 3 interpreter and graphics installation.

With Brython-Server the student also has the option of sharing work with friends, by sharing the Brython-Server Github URL for the repository. Again, the repository must be public for this to work.

Up to this point, nothing in this appendix *depends* on the existence of Brython-Server. However, with increasing use of Chromebooks in the classroom, many students will find it inconvenient to install native Python 3 and graphics libraries on their own devices. For these students, editing code and commiting to Github is a viable alternative. 

