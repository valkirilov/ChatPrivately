'use strict';

angular.module('myApp.services.rooms-service', [])
.factory('RoomsService', function ($http, Restangular) {
  
  var rooms;
  var baseRooms = Restangular.all('api/rooms');

  var fetch = function(user) {
    rooms = Restangular.all('api/rooms/'+user).getList().$object;
    return rooms;
  };
  var fetchMessages = function(roomId) {
    var messages = Restangular.all('api/messages/'+roomId).getList();
    return messages;
  };
  var getRoomName = function(participants, userId, friends) {

    // var users = participants.filter(function(item) {
    //   if (item !== userId)
    //     return item;
    // });
    var users = participants;

    var friendsNames = {};
    friends.forEach(function(item) {
      friendsNames[item.id] = item.username;
    });

    var names = [];
    users.forEach(function(item) {
      names.push(friendsNames[item]);
    });

    return names.join();
  };

  var create = function(participants, user, friends) {
    var title = getRoomName(participants, user, friends);
    var promise = $http.post('/api/rooms/create', { participants: participants, title: title });

    return promise;
  };


  return {
    fetch: fetch,
    create: create,
    fetchMessages: fetchMessages,
    getRoomName: getRoomName
  };
});