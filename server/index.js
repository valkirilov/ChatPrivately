var express = require('express'),
    path = require('path'),
    io = require('socket.io'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = io.listen(server);

require('./sockets/base')(io);

//app.use('/', express.static(__dirname  + '../app'));
app.use(express.static(path.join(__dirname, '../app')));

module.exports = server;