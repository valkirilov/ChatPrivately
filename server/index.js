var express = require('express'),
    path = require('path'),
    io = require('socket.io'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = io.listen(server),
    bodyParser = require('body-parser'),
    MongoClient = require('mongodb').MongoClient,
    mongoose = require('mongoose'),
    authenticate = require("authenticate");

var port = process.env.PORT || 9999;
var settings = {
    db: 'mongodb://localhost/chatprivately'
};

if (port === 9999) {
    settings = require('./config/local.js');
}
else {
    settings = require('./config/live.js');
}

// MongoDB reference
users = require('./routes/users');
rooms = require('./routes/rooms');
messages = require('./routes/messages');
friends = require('./routes/friends');

mongoose.connect(settings.DB_ADDRESS);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {

  setup_express(users(db), rooms(db), messages(db), friends(db));
});

function setup_express(users, rooms, messages, friends) {
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, '../public')));
    //app.use(express.static(path.join(__dirname, '../uploads/avatars')));
    app.use(express.static(path.join(__dirname, '../uploads')));

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
    app.use('/api/friends', friends);

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