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

  $scope.init = function() {
    $scope.addDashboardTab();

    $rootScope.initRooms();
    $rootScope.initFriends();

    // Check if we are on a specific user
    var username = $routeParams.username || null;
    if (username) {
      $scope.addUserTab(username);
    }
  };

  $scope.chatOpenHandle = function(data) {
    if ($rootScope.getItemFromArray($scope.tabs, data.roomId, { isIndex: true, id: 'roomId' }) !== null) {
      //console.log('Already opened');
      return;
    }
    else {
      //console.log('We should open the room');
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
      // Room doesnt exsit, fetch it
      RoomsService.fetchOne(roomId).then(function(room) {
        room.messages = [];
        $rootScope.rooms[room.id] = room;
        $scope.addRoomTab(room, callback);
      });
    }
    else {
      // Room exsit, just open it
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
  $scope.addSpecialTab = function(type, title, template) {
    var indexOfProfileTab = $rootScope.getItemFromArray($scope.tabs, title, { isIndex: true, id: 'title' });
    if (indexOfProfileTab === null) {
      $scope.tabs.push({ template: template, title: title, type: type });
      $timeout(function() {
        $rootScope.selectedIndex = $scope.tabs.length - 1;
      }, 100);
    }
    else {
      $timeout(function() {
        $rootScope.selectedIndex = indexOfProfileTab; 
      }, 100);
    }

    // Some checks for a special tabs
    if (type === 'friends') {
      $scope.fetchFriends();
    }
  };

  /**
   * This function is used to fetch friends details when the tab is opened
   * @return {[type]} [description]
   */
  $scope.fetchFriends = function() {
    UserService.fetchFriendsRequests($rootScope.user).then(function(response) {
      $rootScope.friendsRequests = {};
      if (response.data.length === 0)
        return;
      
      response.data.forEach(function(request) {
        $rootScope.friendsRequests[request.id] = request;
      });
    });

    UserService.fetchFriendsRecommended($rootScope.user).then(function(response) {
      $rootScope.friendsRecommended = {};
      if (response.data.length === 0)
        return;

      response.data.forEach(function(friend) {
        $rootScope.friendsRecommended[friend.id] = friend;
      });
    });

    UserService.fetchFriends($rootScope.user).then(function(response) {
      $rootScope.friends = {};
      if (response.data.length === 0)
        return;

      response.data.forEach(function(friend) {
        $rootScope.friends[friend.id] = friend;
      });
    });
  };

  /**
   * This function is used to send friend requuest to a specific user
   * @param {[object]} friend [description]
   */
  $scope.sendFriendRequest = function(friend) {
    UserService.sendFriendRequest($rootScope.user, friend).then(function(response) {
      //console.log(response);
      if (response.data.success) {
        $scope.fetchFriends();

        var message = $rootScope.user.username+' send you a friend request';
        chatSocket.emit('notification', $rootScope.user.id, friend.id, message);
      }
    });
  };

  $scope.acceptFriendRequest = function(request) {
    UserService.acceptFriendRequest(request).then(function(response) {
      if (response.data.success) {
        $scope.fetchFriends();

        var message = $rootScope.user.username+' accepted your friend request';
        chatSocket.emit('notification', $rootScope.user.id, request.friendId, message);
      }
    });
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

  $rootScope.$on('addSpecialTab', function(data, type, title, template) {
    $scope.addSpecialTab(type, title, template);
  });

  chatSocket.on('user'+$rootScope.user.id, function(data) {
    if (!data.action) {
      return;
    }
    
    if (data.action === 'chatOpen') {
      //$rootScope.initRooms();
      $scope.chatOpenHandle(data);
    }
    else if (data.action === 'message') {
      // console.log('Message received');
      // console.log(data);

      var room = $rootScope.rooms[data.roomId];
      if (room.messages === undefined) {
        $scope.chatOpenHandle(data);
      }

      room.messages.push({ 
        user: data.user, 
        username: data.username, 
        content: CryptoJS.AES.decrypt(data.content, data.key).toString(CryptoJS.enc.Utf8), 
        isCrypted: data.isCrypted });

      //room.contentElement.animate({ scrollTop: room.contentElement.find('md-item:last').offset().top }, "slow");
      scrollMessages(room);
    }
    else if (data.action === 'notification') {
      console.log('Notification received');
      $rootScope.showToastMessage(data.message);

      if (data.type === 'friend') {
        $scope.fetchFriends();
      }
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