Overview
========
Build.js is a development tool for JavaScript hacking. From a list of source files it produces a single .js file that is optimized using the Google Closure Compiler.

Build.js can be run ad hoc or with a --watch flag, in which case it monitors the list of source files and refreshes the single .js output file as and when any of the source file change.



Settings
=============
Configure your project in a buildjs.json file. Three settings can be configured:
- build_dir
- app_file (optional)
- src


build_dir
---------
Specifies the directory in which Build.js will place temporary files.


app_file
--------
By default build.js creates a single output file named "app.js". You can override the default with the app_file setting.


src
---
An array of .js source files that constitute your JavaScript application.


Running Build.js
================
Run buildjs from the directory that contains your project's buildjs.json configuration.
To continuously produce the output .js file, add the --watch flag.


Example project
===============
See the examples/simple/ directory for an example project. 




