#!/usr/bin/env node
var server = require('./server/index');
var port = process.env.PORT || 9999;

server.listen(port);
console.log('Express server listening on port ' + server.address().port + ' / or ' + port);

// var http = require('http'),
//     socketio = require('socket.io');

// app.set('port', process.env.PORT || 3333);

// var server = app.listen(app.get('port'), function() {
//     console.log('Express server listening on port ' + server.address().port);
// });