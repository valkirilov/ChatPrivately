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
  $scope.selectedIndex = -1;
  $scope.messagesHeight = 300;

  $scope.addTab = function (roomId, callback) {
    var room = $rootScope.rooms[$rootScope.getItemFromArray($rootScope.rooms, roomId, { isIndex: true })];
    var title = room.title;

    room.messages = [];
    $scope.tabs.push({ title: title, room: room, roomId: roomId });
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
      if ($rootScope.getItemFromArray($scope.tabs, data.roomId, { isIndex: true, id: 'roomId' }) !== null) {
        return;
      }

      $scope.addTab(data.roomId, function(room) {
        
        RoomsService.fetchMessages(data.roomId).then(function(response) {
          room.messages = response;  

          setTimeout(function() {
            setMessagesHeight();
            scrollMessages(room);
          }, 1000);
        });
      });
    }
    else if (data.action === 'message') {
      // console.log('Message received');
      // console.log(data);

      var room = $rootScope.rooms[$rootScope.getItemFromArray($rootScope.rooms, data.roomId, { isIndex: true })];
      room.messages.push({ user: data.user, username: data.username, content: data.message });

      //room.contentElement.animate({ scrollTop: room.contentElement.find('md-item:last').offset().top }, "slow");
      scrollMessages(room);
    }
  });

  function scrollMessages(room) {
    if (!room.contentElement) {
      room.contentElement = angular.element('#room-'+room.id);
    }
    room.contentElement.animate({ scrollTop: room.contentElement.find('md-item:last').offset().top }, "slow");
  }

  function setMessagesHeight() {
    var messages = angular.element('.messages');
    var body = angular.element('body');

    $scope.messagesHeight = (parseInt(body.height()) - 200)+'px';
  }
  setMessagesHeight();


}]);