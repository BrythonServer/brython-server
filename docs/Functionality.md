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

