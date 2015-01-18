
var request = require('request'),
    ObjectID = require('mongodb').ObjectID,
    http = require('http'),
    querystring = require('querystring'),
    requestify = require('requestify'); 

module.exports = function (io) {
  'use strict';
  io.on('connection', function (socket) {
    console.log('A new connection was established.');

    socket.on('disconnect', function(){
      console.log('User disconnected');
    });

    /** This socket is responsible for accepting and sending messages */
    socket.on('message', function (room, user, message) {
      console.log('Messege recieve');
      room.participants.forEach(function(item) {
        console.log('Send message to ' + item);
        
        // Send message to the others
        io.sockets.emit('user'+item, {
          action: 'message',
          roomId: room.id,
          user: user.id,
          username: user.username,
          content: message.content,
          isCrypted: message.isCrypted,
          key: message.key
        });
      });

      // Save the message to the db
      var data = {
          "roomId": room.id,
          "user": user.id,
          "username": user.username,
          "content": message.content,
          "isCrypted": message.isCrypted
        },
        dataString = JSON.stringify(data),
          headers = {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString) 
        },
        options = {
          //host: 'chat-privately-40399.onmodulus.net',
          host: 'localhost',
          port: process.env.PORT || 9999,
          path: '/api/messages/',
          method: 'POST',
          headers: headers
        };

      // console.log('lets save it');
      // console.log(dataString);
      // console.log(options);

    
      var reqSave = http.request(options, function(res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function(data) {
          //console.log('Response here');
          responseString += data;
        });

        res.on('end', function() {
          var resultObject = JSON.parse(responseString);
          // console.log('Saved');
          // console.log(resultObject);
        });
      });

      reqSave.on('error', function(e) {
        console.log('Error on saving.');
        console.log(e);
      });

      console.log('Send req');
      reqSave.write(dataString);
      reqSave.end();

    });

    /** This socket is responsibkle for receiving and resending notifications */
    socket.on('notification', function (from, to, message) {
      // Send message to the receiver
      io.sockets.emit('user'+to, {
        action: 'notification',
        type: 'friend',
        message: message
      });
    });

    /** This socket is responsible for opening chat wewindows to the participants */
    socket.on('chatOpen', function (roomId, participants) {
      participants.forEach(function(item) {
        console.log('Send chatOpen to ' + item);
        
        io.sockets.emit('user'+item, {
          action: 'chatOpen',
          roomId: roomId,
        });
      });
    });

  });
};