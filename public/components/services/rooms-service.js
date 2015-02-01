'use strict';

angular.module('myApp.services.rooms-service', [])
.factory('RoomsService', function ($http, Restangular) {
  
  var rooms;
  var baseRooms = Restangular.all('api/rooms');

  var fetch = function(user) {
    rooms = Restangular.all('api/rooms/'+user).getList();
    return rooms;
  };
  var fetchOne = function(roomId) {
    var room = Restangular.oneUrl('api/rooms/id/'+roomId).get();
    return room;
  };

  var fetchMessages = function(roomId, page) {
    var response = $http.get('api/messages/'+roomId+'/'+page);

    return response;
  };
  var getRoomName = function(participants, user, friends) {

    // var users = participants.filter(function(item) {
    //   if (item !== userId)
    //     return item;
    // });
    var users = participants;

    var friendsNames = {};
    for (var friendIndex in friends) {
      var friend = friends[friendIndex];
      friendsNames[friend.id] = friend.username;
    }

    var names = [];
    users.forEach(function(item) {
      if (item.toString() === user.id.toString()) {
        names.push(user.username);    
      }
      else {
        names.push(friendsNames[item]);  
      }
      
    });

    return names.join();
  };

  var create = function(participants, user, friends) {
    var title = getRoomName(participants, user, friends);
    var promise = $http.post('/api/rooms/create', { participants: participants, title: title });

    return promise;
  };

  var isRoomInitiated = function(rooms, participants) {
    var result = {
      isFound: false,
      roomId: null
    };
    for (var index in rooms) {
      var currentRoom = rooms[index];

      if (currentRoom.participants.length !== participants.length)
        continue;

      var isTheSameRoom = true;
      currentRoom.participants.forEach(function(user) {
        if (participants.indexOf(user) === -1) {
          isTheSameRoom = false;
          return;
        }
      });

      if (isTheSameRoom) {
        result.isFound = true;
        result.roomId = currentRoom.id;
        return result;
      }
    }

    return result;
  };


  return {
    fetch: fetch,
    fetchOne: fetchOne,
    create: create,
    fetchMessages: fetchMessages,
    getRoomName: getRoomName,
    isRoomInitiated: isRoomInitiated
  };
});