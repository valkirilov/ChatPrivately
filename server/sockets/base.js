
var request = require('request'),
    ObjectID = require('mongodb').ObjectID;

module.exports = function (io) {
  'use strict';
  io.on('connection', function (socket) {
    console.log('A new connection was established.');

    socket.on('disconnect', function(){
      console.log('User disconnected');
    });

    socket.on('message', function (room, user, message) {
      console.log('Messege recieve');
      room.participants.forEach(function(item) {
        console.log('Send message to ' + item);
        
        // Send message to the others
        io.sockets.emit('user'+item, {
          action: 'message',
          roomId: room.id,
          username: user.username,
          message: message
        });
      });

      // Save the message to the db
      var data = JSON.stringify({
        "roomId": room.id,
        "user": user.id,
        "username": user.username,
        "content": message
      });
      console.log(data);

      request.post('http://localhost:9999/api/messages', { 
        body: data, 
        headers: {
        'socket': 'my-header',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }}, function(error, response, body) {
        console.log('ERROR');
        console.log(error);
        //console.log(response);
        console.log('BODY');
        console.log(body);
        console.log('Response here');
      });

    });

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