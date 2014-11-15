'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', '$rootScope', 'chatSocket', 'UserService', 'RoomsService',
  function($scope, $rootScope, chatSocket, UserService, RoomsService) {

  $scope.messages = [];
  $scope.tabs = [];
  $scope.selectedIndex = 0;

  $scope.addTab = function (roomId, callback) {
    var room = $rootScope.rooms[$rootScope.getItemFromArray($rootScope.rooms, roomId, true)],
        title = roomId;

    room.messages = [];
    $scope.tabs.push({ title: title, room: room});
    callback(room);
  };


  $scope.send = function($event) {
    if ($event && $event.keyCode !== 13) {
      return;
    }

    var room = $scope.tabs[$scope.selectedIndex].room,
        user = $rootScope.user,
        message = angular.copy($scope.message);

    // Filter sending data
    room = {
      id: room.id,
      participants: room.participants
    };

    console.log('Sending message');
    chatSocket.emit('message', room, user, message);
    $scope.message = '';
  };

  $scope.$on('socket:broadcast', function(event, data) {
    if (!data.content) {
      return;
    }

    //console.log(data);

    $scope.messages.push(data);
  });

  chatSocket.on('user'+$rootScope.user.id, function(data) {
    if (!data.action) {
      return;
    }
    
    if (data.action === 'chatOpen') {
      console.log('Opening room');
      $scope.addTab(data.roomId, function(room) {
        console.log('Fetchiing messages');
        room.messages = RoomsService.fetchMessages(data.roomId);
      });
    }
    else if (data.action === 'message') {
      console.log('Message received');
      console.log(data);

      var room = $rootScope.rooms[$rootScope.getItemFromArray($rootScope.rooms, data.roomId, true)];
      room.messages.push({ username: data.username, content: data.message });
    }
  });

}]);