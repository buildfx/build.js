Overview
========
Build.js is a development tool for JavaScript hacking. Given a source file with dependencies (and, optionally, one or more property files), it produces a single output file.


Running Build.js
================
buildjs \[flags\] 


Flags
-----  
	-source {filepath}
		Path to root JavaScript file. Defaults to core.js

	-out {filepath}
		Path to output file. Defaults to app.js

	-depend-pattern {regex}
		Regular expression for determining dependencies. Defaults to @dep[end]*\\s(?P<filepath>[a-zA-Z./_0-9]+)

	-propfiles {filepaths}
		Comma-separated list of filepaths to property files. Optional.


Example
=======
In addition to the test suite, there is a contrived example project, which you can build like so:

	./buildjs -source example/core.js -propfiles example/properties/app.properties

This will create app.js, after having determined the correct order in which to serialize the JavaScript files.