angular-bootstrap-seed
======================

Seed for my Angular projects. Bootstrap and Grunt configuration included.

# Setup

    git clone https://github.com/valkirilov/angular-bootstrap-seed.git
    npm install
    bower install

# Run

    grunt

    > Running "connect:server" (connect) task
	> Started connect web server on http://0.0.0.0:8000

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

