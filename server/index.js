var express = require('express'),
    path = require('path'),
    io = require('socket.io'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = io.listen(server),
    bodyParser = require('body-parser'),
    MongoClient = require('mongodb').MongoClient,
    authenticate = require("authenticate");

// MongoDB reference
users = require('./routes/users');
rooms = require('./routes/rooms');
messages = require('./routes/messages');

MongoClient.connect('mongodb://valkirilov:password@proximus.modulusmongo.net:27017/d2urezAm', function(err, db) {
    if (err) {
        console.error('Cannot connect to the database', err);
        return;
    }

    setup_express(users(db), rooms(db), messages(db));
});

function setup_express(users, rooms, messages) {
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, '../app')));

    app.use(authenticate.middleware({
        encrypt_key: "my-encription-key-victoria", // Add any key for encrypting data
        validate_key: "my-validation-key-victoria" // Add any key for signing data
    }));

    app.use(function(req, res, next) {
      console.log(req.url);
      if (req.url === '/api/users/login' ||
        req.url === '/api/users/register' ||
        req.url.indexOf('api' === -1)) {
        next();
      }
      else if(req.url === '/api/messages') {
        console.log('HERE');
        //console.log(req);
        next();
      }
      else if(!req.user.user_id) {
        // No auth, redirect or show error page
        res.writeHead(200, {
          "Content-Type": "application/json"
        });
        res.write('{error:"Authentication Error"}');
        res.end();
        return;
      }
    });

    app.use('/api/users', users);
    app.use('/api/rooms', rooms);
    app.use('/api/messages', messages);

    require('./sockets/base')(io);

    // catch 404 and forward to error handler
    // app.use(function(req, res, next) {
    //     var err = new Error('Not Found');
    //     err.status = 404;
    //     next(err);
    // });

    // error handlers

    // development error handler
    // will print stacktrace
    // app.use(function(err, req, res, next) {
    //     res.status(err.status || 500);
    //     res.render('error', {
    //         message: err.message,
    //         error: err
    //     });
    // });
}

module.exports = server;