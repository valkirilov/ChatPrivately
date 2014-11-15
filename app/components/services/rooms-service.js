'use strict';

angular.module('myApp.services.rooms-service', [])
.factory('RoomsService', function ($http, Restangular) {
  
  var rooms;
  var baseRooms = Restangular.all('api/rooms');

  var fetch = function() {
    rooms = baseRooms.getList().$object;
    return rooms;
  };
  var fetchMessages = function(roomId) {
    var messages = Restangular.all('api/messages/'+roomId).getList().$object;
    return messages;
  };

  var create = function(participants) {
    var promise = $http.post('/api/rooms/create', { participants: participants });

    return promise;
  };


  return {
    fetch: fetch,
    create: create,
    fetchMessages: fetchMessages
  };
});