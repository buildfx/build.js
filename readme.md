Overview
========
Build.js is a development tool for JavaScript hacking. From a list of source files it produces a single .js file that is optimized using the Google Closure Compiler.

Build.js can be run ad hoc or with a --watch flag, in which case it monitors the list of source files and refreshes the single .js output file as and when any of the source files change.



Settings
=========
Configure your project in a buildjs.json file. Three settings can be configured:
- build_dir
- app_file (optional; default=app.js)
- src
- rewrites (optional)
- wrap_in_anonymous (optional; default=true)
- no_optimize (optional; default = --watch ? true : false)

build_dir
---------
Specifies the directory in which Build.js will place temporary files.


app_file
--------
By default build.js creates a single output file named "app.js". You can override the default with the app_file setting.


src
---
An array of .js source files that constitute your JavaScript application.


rewrites
--------
An optional array of source code rewrites you want to apply to the single .js file.
Each item in the array has a "from" and a "to" slot. The "from" slot is a regular expression.


wrap_in_anonymous
-----------------
By default the content of each source file is wrapped in an anoymous function that is executed immediately so as to prevent variable clobbering. To turn this off for your build, set wrap_in_anonymous=false.


no_minify
---------
Whether or not the JS compiler/minifier is run. The default value is set to 'true' if the --watch flag is set, otherwise the default value is 'false'. This is useful while you're developing since you can see the original JavaScript source code in the debugger.


Running Build.js
================
Run bin/buildjs from the directory that contains your project's buildjs.json configuration.
To continuously produce the output .js file, add the --watch flag.


Example project
===============
See the examples/simple/ directory for an example project. 
