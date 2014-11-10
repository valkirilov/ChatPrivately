module.exports = function (io) {
  'use strict';
  io.on('connection', function (socket) {
    console.log('A new connection was established.');

    socket.on('disconnect', function(){
      console.log('User disconnected');
    });

    socket.on('message', function (from, msg) {
      io.sockets.emit('broadcast', {
        content: msg,
        username: from
      });
    });
  });
};