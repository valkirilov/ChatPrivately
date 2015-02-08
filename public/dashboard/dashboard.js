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

.controller('DashboardCtrl', ['$scope', '$rootScope', '$routeParams', '$timeout', 'chatSocket', 'UserService', 'RoomsService', 'PostsService', '$mdBottomSheet', 'ipCookie', '$mdDialog',
  function($scope, $rootScope, $routeParams, $timeout, chatSocket, UserService, RoomsService, PostsService, $mdBottomSheet, ipCookie, $mdDialog) {

  $scope.messages = [];
  $scope.tabs = [];
  $scope.messagesHeight = 300;

  $scope.post = { message: 'Type something here..' };
  $scope.posts = [];
  $scope.myPosts = [];

  $scope.newAvatar = null;

  $scope.init = function() {
    $scope.addDashboardTab();

    $rootScope.initRooms();
    $rootScope.initFriends();

    PostsService.fetch($rootScope.user.id).then(function(response) {
      for (var i=0; i<response.length; i++) {
        response[i].date = moment(response[i].date).from();
      }

      $scope.posts = response;
    });

    // Check if we are on a specific user
    var username = $routeParams.username || null;
    if (username) {
      $scope.addUserTab(username);
    }
  };

  $scope.chatOpenHandle = function(data) {
    if ($rootScope.getItemFromArray($scope.tabs, data.roomId, { isIndex: true, id: 'roomId' }) !== null) {
      //$scope.selectTab('room', data.roomId);
      return;
    }
    else {
      //console.log('We should open the room');
    }

    $scope.addTab(data.roomId, function(room) {
      room.page = 1;
      $scope.loadMessages(room);
    });
  };

  $scope.loadMessages = function(room) {
    if (room.pages && room.page > room.pages)
      return;

    RoomsService.fetchMessages(room.id, room.page).then(function(response) {
      room.page++;
      room.pages = response.data.pages;
      room.messages = response.data.messages.length === 0 ? [] : room.messages;

      // Now let's decode the messages
      response.data.messages.forEach(function(message) {
        message.content = $scope.decodeMessage(message);
        room.messages.unshift(message);
      });

      setTimeout(function() {
        setMessagesHeight();
        scrollMessages(room);
      }, 100);
    });
  };

  $scope.loadOlderMessages = function(roomId) {
    console.log(roomId);

    $scope.loadMessages($rootScope.rooms[roomId]);
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
    else if (type === 'profile') {
      $scope.fetchMyPosts(); 
    }
  };
  $scope.selectTab = function(type, search) {
    switch(type) {
      case 'room':
        for (var i in $scope.tabs) {
          if ($scope.tabs[i].type === 'room' && $scope.tabs[i].roomId === search) {
            $rootScope.selectedIndex = i;
            return;
          }
        }
        break;
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

  $scope.fetchMyPosts = function() {
    PostsService.fetchMy($rootScope.user.id).then(function(response) {
      $scope.myPosts = {};
      if (response.length === 0)
        return;

      for (var i=0; i<response.length; i++) {
        response[i].date = moment(response[i].date).from();
      }
      
      $scope.myPosts = response;
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

  $scope.addPost = function() {
    var message = angular.copy($scope.post.message);

    if (message.length === 0 || message === '' || message === 'Type something here..')
      return;

    PostsService.create($rootScope.user.id, message).then(function(response) {
      if (response.data.success) {
        
        $scope.posts.unshift({
          userId: $rootScope.user.id,
          message: message
        });

        $scope.post.message = 'Type something here..';
        $rootScope.showToastMessage('Post added successfully');
      }
      else {
        $rootScope.showError('Post cannot be added.');
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
      switch(clickedItem.name) {
        case 'Stats':
          $scope.showStats();
          break;
        default:
          $rootScope.showToastMessage('This is still not implemented :(');
          break;
      }
    });
  };

  /**
   * Used to show the stats for the current chat
   * @return {[type]} [description]
   */
  $scope.showStats = function() {

    var roomId = $scope.tabs[$scope.selectedIndex].roomId;
    RoomsService.fetchStats(roomId).then(function(response) {
      console.log(response);

      if (response.status === 200) {
        $mdDialog.show({
          controller: StatsController,
          templateUrl: 'alerts/alert-room-stats.tmpl.html',
          locals: {
            stats: response.data
          }
        });
      }
      else {
        $rootScope.showToastMessage(response.message);
      }

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

    var message = $scope.encodeMessage(messageText);

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

      var content = $scope.decodeMessage(data);

      room.messages.push({ 
        user: data.user, 
        username: data.username, 
        content: content, 
        date: new Date(),
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

  $scope.encodeMessage = function(content, receiver) {
    var encoded = {
      content: content,
      isCrypted: false
    };

    if ($rootScope.isKeysLoaded) {
      encoded.content = CryptoJS.AES.encrypt(content, $rootScope.user.passphrase).toString();
      encoded.isCrypted = true;
      encoded.key = $rootScope.user.passphrase;
    }
  
    return encoded;
  };

  $scope.decodeMessage = function(message) {
    var decoded;

    if (message.isCrypted) {
      var key = (message.user === $rootScope.user.id) ? $rootScope.user.passphrase : $rootScope.friends[message.user].passphrase;
      decoded = CryptoJS.AES.decrypt(message.content, key).toString(CryptoJS.enc.Utf8);
    }
    else {
      decoded = message.content;
    }

    return decoded;
  };

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