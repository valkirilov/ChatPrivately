'use strict';

angular.module('myApp.dashboard', ['ngRoute', 'flow'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
  $routeProvider.when('/dashboard/:username', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
}])

.config(['flowFactoryProvider', function (flowFactoryProvider) {
  flowFactoryProvider.defaults = {
    target: '/api/users/upload/avatar',
    permanentErrors: [404, 500, 501],
    maxChunkRetries: 1,
    chunkRetryInterval: 5000,
    simultaneousUploads: 4,
    singleFile: true,
    testChunks: false
  };
  flowFactoryProvider.on('catchAll', function (event) {
    //console.log('catchAll', arguments);
  });
  // Can be used with different implementations of Flow.js
  // flowFactoryProvider.factory = fustyFlowFactory;
}])

.controller('DashboardCtrl', ['$scope', '$rootScope', '$routeParams', '$timeout', 'chatSocket', 'UserService', 'RoomsService', '$mdBottomSheet', 'ipCookie',
  function($scope, $rootScope, $routeParams, $timeout, chatSocket, UserService, RoomsService, $mdBottomSheet, ipCookie) {

  $scope.messages = [];
  $scope.tabs = [];
  $scope.messagesHeight = 300;

  $scope.newAvatar = null;

  $rootScope.initRooms();

  $scope.init = function() {
    $scope.addDashboardTab();

    // Check if we are on a specific user
    var username = $routeParams.username || null;
    if (username) {
      $scope.addUserTab(username);
    }
  };

  $scope.chatOpenHandle = function(data) {
    if ($rootScope.getItemFromArray($scope.tabs, data.roomId, { isIndex: true, id: 'roomId' }) !== null) {
      console.log('Already opened');
      return;
    }

    $scope.addTab(data.roomId, function(room) {
      RoomsService.fetchMessages(data.roomId).then(function(response) {
        room.messages = response.length === 0 ? [] : response;  

        setTimeout(function() {
          setMessagesHeight();
          scrollMessages(room);
        }, 100);
      });
    });
  };

  /* Add tab is preparing and calling addRoom tab to finish the job */
  $scope.addTab = function (roomId, callback) {
    var room = $rootScope.rooms[roomId];
    if (!room) {
      RoomsService.fetchOne(roomId).then(function(room) {
        room.messages = [];
        $rootScope.rooms[room.id] = room;
        $scope.addRoomTab(room, callback);
      });
    }
    else {
      $scope.addRoomTab(room, callback);
    }
  };
  $scope.addRoomTab = function(room, callback) {
    var title = room.title;

    room.messages = [];
    $scope.tabs.push({ template: "dashboard/room.tmpl.html", title: title, room: room, roomId: room.id, type: 'room' });
    $timeout(function() {
      $rootScope.selectedIndex = $scope.tabs.length - 1;
    }, 100);
    callback(room);
  };

  $scope.addDashboardTab = function() {
    $scope.tabs.push({ template: "dashboard/dashboard.tmpl.html", title: 'Dashboard', type: 'dashboard' });
    $timeout(function() {
      $rootScope.selectedIndex = 0;
    }, 100);
  };
  $scope.addUserTab = function(username) {
    // Check if the user exist
    UserService.getUserByUsername(username).then(function(response) {
      if (!response.data.success) {
        alert('User doesn\'t exist');
        return;
      }

      $scope.userProfile = { 
        username: response.data.username,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
      };

      $scope.tabs.push({ template: "dashboard/user.tmpl.html", title: "Profile: " + username, type: 'user' });
      $timeout(function() {
        $rootScope.selectedIndex = $scope.tabs.length - 1;
      }, 100);
    });
  };
  $scope.addProfileTab = function() {
    var indexOfProfileTab = $rootScope.getItemFromArray($scope.tabs, 'Profile', { isIndex: true, id: 'title' });
    if (indexOfProfileTab === null) {
      $scope.tabs.push({ template: "dashboard/profile.tmpl.html", title: 'Profile', type: 'profile' });
      $timeout(function() {
        $rootScope.selectedIndex = $scope.tabs.length - 1;
      }, 100);
    }
    else {
      $timeout(function() {
        $rootScope.selectedIndex = indexOfProfileTab; 
      }, 100);
    }
  };

  $scope.avatarAddedHandle = function($file) {
    if ($file.getExtension().match(/(^jpg$)|(^jpeg$)|(^gif$)|(^png$)/gi) === null) {
      $rootScope.showError("Only images are allowed");
      return false;
    }

    var MAX_SIZE = 1 * 1024 * 1024;
    if ($file.size > MAX_SIZE) {
      $rootScope.showError("Maximum size is 1MB");
      return false;
    }

    return true;
  };
  $scope.avatarSuccessHandle = function($file, $message) {
    $scope.newAvatar = JSON.parse($message).path;
    $scope.updateAvatar();
  };
  $scope.updateAvatar = function() {
    UserService.saveAvatar($rootScope.user.id, $scope.newAvatar).then(function(response) {
      if (response.data.success) {
        $rootScope.user.avatar = response.data.avatar;
        ipCookie('user', $rootScope.user, { expires: 21 });
      }

      $rootScope.showToastMessage(response.data.message);
    });
  };

  $scope.showGridBottomSheet = function($event) {
    $scope.alert = '';
    $mdBottomSheet.show({
      templateUrl: 'message-options/message-options.html',
      controller: 'MessageOptionsCtrl',
      targetEvent: $event
    }).then(function(clickedItem) {
      $scope.alert = clickedItem.name + ' clicked!';
    });
  };


  $scope.send = function($event) {
    if ($event && $event.keyCode !== 13) {
      return;
    }

    var room = $scope.tabs[$scope.selectedIndex].room,
        user = $rootScope.user,
        messageText = angular.copy($scope.message);

    // Filter sending data
    room = {
      id: room.id,
      participants: room.participants
    };

    var message = {
      content: messageText,
      isCrypted: false
    };

    if ($rootScope.isKeysLoaded) {
      message.content = CryptoJS.AES.encrypt(messageText, $rootScope.user.passphrase).toString();
      message.isCrypted = true;
      message.key = $rootScope.user.passphrase;
    }

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

  $rootScope.$on('addProfileTab', function() {
    $scope.addProfileTab();
  });

  chatSocket.on('user'+$rootScope.user.id, function(data) {
    if (!data.action) {
      return;
    }
    
    if (data.action === 'chatOpen') {
      $scope.chatOpenHandle(data);
    }
    else if (data.action === 'message') {
      // console.log('Message received');
      // console.log(data)

      var room = $rootScope.rooms[data.roomId];
      if (room.messages === undefined) {
        $scope.chatOpenHandle(data);
      }

      //console.log('Message received');
      //console.log(data);

      room.messages.push({ 
        user: data.user, 
        username: data.username, 
        content: CryptoJS.AES.decrypt(data.content, data.key).toString(CryptoJS.enc.Utf8), 
        isCrypted: data.isCrypted });

      //room.contentElement.animate({ scrollTop: room.contentElement.find('md-item:last').offset().top }, "slow");
      scrollMessages(room);
    }
  });

  function scrollMessages(room) {
    if (!room.contentElement || room.contentElement.length === 0) {
      // console.log('Attach');
      // console.log(room);
      room.contentElement = angular.element('#room-'+room.id);
    }

    room.contentElement.animate({ scrollTop: room.contentElement.find('.bottom').get(0).offsetTop+'px' }, "slow");
  }

  function setMessagesHeight() {
    var messages = angular.element('.messages');
    var body = angular.element('body');

    $scope.messagesHeight = (parseInt(body.height()) - 200)+'px';
  }
  setMessagesHeight();

  $scope.init();


}]);