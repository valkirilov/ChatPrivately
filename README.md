Chat Privately
======================

This is a simple chat project.
For now the project is under dev.

# Setup

    git clone repo
    npm install
    bower install

# Run

You can run it with one simple task, it will start the server and the client

	grunt    
    
Or you can run them separately

    node server
  > Express server listening on port 9999 / or 9999

    grunt old
	> Running "nggettext_extract:pot" (nggettext_extract) task

	> Running "nggettext_compile:all" (nggettext_compile) task

	> Running "sass:dist" (sass) task

	> Running "concat:css" (concat) task
	File app/styles/app.css created.

	> Running "watch" task
	Waiting...


# Run tests

    npm test

    > myApp@0.0.0 pretest /home/valentin/Documents/Dev/angular-bootstrap-seed
	> npm install


	> myApp@0.0.0 postinstall /home/valentin/Documents/Dev/angular-bootstrap-seed
	> bower install


	> myApp@0.0.0 test /home/valentin/Documents/Dev/angular-bootstrap-seed
	> karma start karma.conf.js

	INFO [karma]: Karma v0.10.10 server started at http://localhost:9876/
	INFO [launcher]: Starting browser Chrome
	INFO [Chrome 38.0.2125 (Linux)]: Connected on socket TP7fwJXj_JSJhZf6wSxZ
	Chrome 38.0.2125 (Linux): Executed 5 of 5 SUCCESS (1.049 secs / 0.267 secs)

