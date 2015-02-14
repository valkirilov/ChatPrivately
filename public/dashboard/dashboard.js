'use strict';

angular.module('myApp.dashboard', ['ngRoute', 'flow', 'ipCookie'])

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
    target: '/api/users/upload/avatar/',
    permanentErrors: [404, 500, 501],
    maxChunkRetries: 3,
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

.controller('DashboardCtrl', ['$scope', '$rootScope', '$routeParams', '$timeout', 'chatSocket','ipCookie', 'UserService', 'RoomsService', 'PostsService', '$mdBottomSheet', '$mdDialog', 'SoundService', 
  function($scope, $rootScope, $routeParams, $timeout, chatSocket, ipCookie, UserService, RoomsService, PostsService, $mdBottomSheet, $mdDialog, SoundService) {

  $scope.messages = [];
  $scope.tabs = [];
  $scope.messagesHeight = 300;

  $scope.post = { message: 'Type something here..' };
  $scope.posts = [];
  $scope.myPosts = [];

  $scope.newAvatar = null;

  /**
   * Init function, that setups the main stuff for this controller
   * @return {[type]} [description]
   */
  $scope.init = function() {
    console.log('Dashboard');
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

  /**
   * This function is opening a new chat tab, when this command is handled
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
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

  /**
   * Loading messages for a specific room from the DB with the RoomsService
   * Loading messages on pages
   * @param  {[type]} room [description]
   * @return {[type]}      [description]
   */
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

      $timeout(function() {
        setMessagesHeight();
        scrollMessages(room);
      }, 100);
    });
  };

  $scope.loadOlderMessages = function(roomId) {
    //console.log(roomId);
    $scope.loadMessages($rootScope.rooms[roomId]);
  };

  /**
   * Here are ome function which are operating on opening different tabs
   */

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

  /**
   * Used to create a new post and add it to the db
   */
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

  /**
   * Check the added image for an avatars and validate it
   * @param  {[type]} $file [description]
   * @return {[type]}       [description]
   */
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
  /**
   * Avatar uploading is successfull, 
   * call the update avatar function, to update it in the db
   * @param  {[type]} $file    [description]
   * @param  {[type]} $message [description]
   * @return {[type]}          [description]
   */
  $scope.avatarSuccessHandle = function($file, $message) {
    $scope.newAvatar = JSON.parse($message).path;
    $scope.updateAvatar();
  };
  /**
   * Update the avatar in the db
   * @return {[type]} [description]
   */
  $scope.updateAvatar = function() {
    UserService.saveAvatar($rootScope.user.id, $scope.newAvatar).then(function(response) {
      if (response.data.success) {
        $rootScope.user.avatar = response.data.avatar;
        $rootScope.profile.avatar = response.data.avatar;

        //ipCookie.remove('user');
        $rootScope.updateCookieUser();
      }

      $rootScope.showToastMessage(response.data.message);
    });
  };

  /**
   * Opening the bottom options sheet for the messages
   * @param  {[type]} $event [description]
   * @return {[type]}        [description]
   */
  $scope.showGridBottomSheet = function($event) {
    $scope.alert = '';
    $mdBottomSheet.show({
      templateUrl: 'message-options/message-options.html',
      controller: 'MessageOptionsCtrl',
      targetEvent: $event
    }).then(function(clickedItem) {

      switch(clickedItem.name) {
        case 'Nothing':
          break;

        case 'Stats':
          $scope.showStats();
          break;

        case 'Image':
          break;

        // case 'Draw':
        //   $scope.startDraw();
        //   break;

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
      //console.log(response);

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

  /**
   * This function is used to start a drawing connversation
   * @return {[type]} [description]
   */
  $scope.startDraw = function() {
    //$scope.send({keyCode: 13}, true);
  };

  /**
   * This function is used to send a specific message in the current opened room
   * @param  {[type]}  $event    [description]
   * @return {[type]}            [description]
   */
  $scope.send = function($event) {
    if ($event && $event.keyCode !== 13) {
      return;
    }

    var room = $scope.tabs[$scope.selectedIndex].room,
        user = $rootScope.user,
        messageText = angular.copy($scope.message);

    if (messageText === '') {
      return;
    }

    // Filter sending data
    room = {
      id: room.id,
      participants: room.participants
    };

    var message = $scope.encodeMessage(messageText);

    chatSocket.emit('message', room, user, message);
    $scope.message = '';
  };

  /**
   * This function is used to send a message to a specific chat room.
   * For now, the images are nly sending, we don't keep it
   * @param  {[type]} file     [description]
   * @param  {[type]} fileData [description]
   * @return {[type]}          [description]
   */
  $rootScope.sendImage = function(file, fileData) {
    var room = $scope.tabs[$scope.selectedIndex].room,
        user = $rootScope.user;

    // Filter sending data
    room = {
      id: room.id,
      participants: room.participants
    };

    var image = {
      isCrypted: false,
      image: {
        file: file,
        data: fileData,
      },
      type: 'image'
    };

    chatSocket.emit('message', room, user, image);
  };

  $scope.$on('socket:broadcast', function(event, data) {
    if (!data.content) {
      return;
    }

    $scope.messages.push(data);
  });

  $rootScope.$on('addSpecialTab', function(data, type, title, template) {
    $scope.addSpecialTab(type, title, template);
  });

  /**
   * Here is the soccket handle for a specific user
   * This is the point that the user receives different commands
   * @param  {[type]} data) {               if (!data.action) {      return;    }        if (data.action [description]
   * @return {[type]}       [description]
   */
  chatSocket.on('user'+$rootScope.user.id, function(data) {
    if (!data.action) {
      return;
    }
    
    if (data.action === 'chatOpen') {
      //$rootScope.initRooms();
      $scope.chatOpenHandle(data);
      SoundService.chatOpen();
    }
    else if (data.action === 'message') {
      // console.log('Message received');
      console.log(data);

      var room = $rootScope.rooms[data.roomId];
      if (room.messages === undefined) {
        $scope.chatOpenHandle(data);
      }

      var content = $scope.decodeMessage(data);

      room.messages.push({ 
        user: {
          id: data.user.id, 
          username: data.user.username, 
        },
        content: content,
        type: data.type,
        image: data.image,
        date: new Date(),
        isCrypted: data.isCrypted });

      if ($rootScope.user.id === data.user.id) {
        SoundService.msgSend();
      }
      else {
        SoundService.msgReceived();  
      }

      //room.contentElement.animate({ scrollTop: room.contentElement.find('md-item:last').offset().top }, "slow");
      scrollMessages(room);

      // Check if we have to show notification
      if ($scope.tabs[$scope.selectedIndex].roomId !== data.roomId) {
        $rootScope.showToastMessage(data.user.username +' is writting you');
      }
    }
    else if (data.action === 'notification') {
      //console.log('Notification received');
      $rootScope.showToastMessage(data.message);

      if (data.type === 'friend') {
        $scope.fetchFriends();
        SoundService.notification();
      }
      else {
        SoundService.friendRequest();
      }
    }
  });

  /**
   * Encoding a message with a specific passphrase
   * @param  {[type]} content  [description]
   * @param  {[type]} receiver [description]
   * @return {[type]}          [description]
   */
  $scope.encodeMessage = function(content, receiver) {
    var encoded = {
      content: content,
      isCrypted: false,
      type: 'text'
    };

    if ($rootScope.isKeysLoaded) {
      encoded.content = CryptoJS.AES.encrypt(content, $rootScope.user.passphrase).toString();
      encoded.isCrypted = true;
      encoded.key = $rootScope.user.passphrase;
    }
  
    return encoded;
  };

  /**
   * Decoding a message with a specific passphrase
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  $scope.decodeMessage = function(message) {
    var decoded;

    if (message.isCrypted) {
      var key = (message.user.id === $rootScope.user.id) ? $rootScope.user.passphrase : $rootScope.friends[message.user.id].passphrase;
      decoded = CryptoJS.AES.decrypt(message.content, key).toString(CryptoJS.enc.Utf8);
    }
    else {
      decoded = message.content;
    }

    return decoded;
  };

  /**
   * Helper function used to scroll the messages
   * @param  {[type]} room [description]
   * @return {[type]}      [description]
   */
  function scrollMessages(room) {
    if (!room.contentElement || room.contentElement.length === 0) {
      // console.log('Attach');
      // console.log(room);
      room.contentElement = angular.element('#room-'+room.id);
    }

    // If the user is at the bottom
    if (room.contentElement.find('.bottom').get(0).offsetTop - room.contentElement.scrollTop() <= $(window).height()) {
      room.contentElement.animate({ scrollTop: room.contentElement.find('.bottom').get(0).offsetTop+'px' }, "slow");
    }
  }

  function setMessagesHeight() {
    var messages = angular.element('.messages');
    var body = angular.element('body');

    $scope.messagesHeight = (parseInt(body.height()) - 200)+'px';
  }
  setMessagesHeight();

  $scope.init();


}]);