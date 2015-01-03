'use strict';

angular.module('myApp.services.chat-socket', [])
.factory('chatSocket', function (socketFactory) {
  var socket = socketFactory();
  socket.forward('broadcast');
  socket.forward('user');
  return socket;
});