'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'ngMaterial',

  'myApp.login',
  'myApp.dashboard',
  'myApp.profile',
  'myApp.message-options',
  'myApp.services',
  'myApp.directives',
  'myApp.version',
  'myApp.victoria',

  'restangular',
  'ui.bootstrap',
  'btford.socket-io',
  'ipCookie',
  'gettext'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/dashboard'});
}])
.controller('GlobalController', ['$scope', '$rootScope', '$location', 'gettextCatalog', 'UserService', 'RoomsService', '$timeout', '$mdSidenav', '$mdDialog', '$mdToast', 'chatSocket', 'ipCookie',
  function($scope, $rootScope, $location, gettextCatalog, UserService, RoomsService, $timeout, $mdSidenav, $mdDialog, $mdToast, chatSocket, ipCookie) {

  /***********************************************
   * Init variables
   ***********************************************/

  $scope.lang = "en";
  $rootScope.user = null;
  $rootScope.profile = null;
  $scope.route;
  $scope.isLoaded = false;
  $rootScope.isKeysLoaded = false;
  $rootScope.crypt = null;
  $rootScope.selectedIndex = 0;

  $scope.viewsNotLogged = ['/login', '/register', '/logo'];

  $rootScope.friends = {};
  $rootScope.friendsRequests = {};
  $rootScope.friendsRecommended = {};
  $rootScope.rooms = {};

  // Getting the friends an listing them as object
  $rootScope.initFriends = function() {
    UserService.fetchFriends($rootScope.user).then(function(response) {
      $rootScope.friends = {};
      if (response.data.length === 0)
        return;

      response.data.forEach(function(friend) {
        $rootScope.friends[friend.id] = friend;
      });
    });
  };

  // Getting rooms an listing them as object
  $rootScope.initRooms = function () {
    var userId = $rootScope.user ? $rootScope.user.id : undefined;
    RoomsService.fetch(userId).then(function(data) {
      $rootScope.rooms = {};
      data.forEach(function(room) {
        $rootScope.rooms[room.id] = room;
      });
    });
  };

  $scope.setLanguage = function(language) {
    $scope.lang = language;
    gettextCatalog.currentLanguage = language;
  };

  /***********************************************
   * Public methods
   ***********************************************/

  $scope.logout = function() {
    UserService.logout(function() {
      $rootScope.closeSidenav('left');
      $rootScope.closeSidenav('right');
      $location.path('login');
    });
  };
  $scope.isLogged = function() {
    //console.log($rootScope.user);
    if (!$rootScope.user) {
      //console.log('user does not exist');
      return false;
    }
    if ($rootScope.user.access_token === undefined || $rootScope.user.access_token === null) {
      //console.log('user does not have access_token');
      return;
    }

    return true;
  };


  $rootScope.closeSidenav = function(position) {
    $mdSidenav(position).close();
  };

  $rootScope.toggleSidenav = function(position) {
    $mdSidenav(position).toggle();
  };

  /** Opening a modal to setup the keys */
  $scope.openKeys = function(ev) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'alerts/alert-keys.tmpl.html',
      targetEvent: ev,
    })
    .then(function(callback) {
      if (callback) {
        callback(); 
      }
    }, function() {
      // canceled event
    });
  };

  /** Opening a modal to create a new chat */
  $scope.createRoom = function(ev) {
    $mdDialog.show({
      controller: CreateRoomController,
      templateUrl: 'alerts/alert-create-room.tmpl.html',
      targetEvent: ev,
    })
    .then(function(callback) {
      if (callback) {
        callback(); 
      }
    }, function() {
      // canceled event
    });
  };

  /************************************
   * CHAT ROOMS
   ************************************/

  /**
   * This function is used to create a new chat room with a givven friendId
   * @param  {[type]} friendId 
   * @return {[type]}          [description]
   */
  $scope.chatFriend = function(friendId) {
    var participants = [$scope.user.id, friendId];

    // Lets check does we have already a room with this person
    var isRoomExist = RoomsService.isRoomInitiated($rootScope.rooms, participants);
    if (isRoomExist.isFound) {
      $scope.chatOpen(isRoomExist.roomId);
    }
    else {
      RoomsService.create(participants, $rootScope.user, $rootScope.friends).then(function(response) {
        if (response.data.success === 'true') {
          var responseRoom = response.data.room;
          $rootScope.rooms[responseRoom.id] = responseRoom;
          $scope.chatOpen(responseRoom.id);
        }
      });
    }
  };

  $rootScope.chatFriends = function(friends) {
    var participants = friends;
    participants.push($scope.user.id);

    // Lets check does we have already a room with this person
    var isRoomExist = RoomsService.isRoomInitiated($rootScope.rooms, participants);
    if (isRoomExist.isFound) {
      $scope.chatOpen(isRoomExist.roomId);
    }

    RoomsService.create(participants, $rootScope.user, $rootScope.friends).then(function(response) {
      if (response.data.success === 'true') {
        var responseRoom = response.data.room;
        $rootScope.rooms[responseRoom.id] = responseRoom;
        $scope.chatOpen(responseRoom.id);
      }
    });
  };

  $scope.chatOpen = function(roomId) {
    var room = $rootScope.rooms[roomId];
    chatSocket.emit('chatOpen', room.id, room.participants);
  };

  /************************************
   * SETTINGS
   ************************************/

  $scope.settingsSaveProfileDetails = function() {
    var newProfileDetails = {
      id: $rootScope.user.id,
      email: $rootScope.profile.email,
      lastName: $rootScope.profile.firstName,
      firstName: $rootScope.profile.lastName,
    };
    UserService.saveProfileDetails(newProfileDetails).then(function(response) {
      if (response.status !== 200) {
        $rootScope.showError(response.data.message);
        return;
      }

      $rootScope.showToastMessage(response.data.message);
      $rootScope.user.firstName = $rootScope.profile.firstName;
      $rootScope.user.lastName = $rootScope.profile.lastName;
      ipCookie('user', $rootScope.user, { expires: 21 });
    });
  };

  $rootScope.settingsSaveKeys = function() {
    $rootScope.showToastMessage("Keys updated");
    $rootScope.user.privateKey = $rootScope.profile.privateKey;
    $rootScope.user.passphrase = CryptoJS.MD5($rootScope.profile.passphraseText).toString();
    //$rootScope.user.publicKey = $rootScope.profile.publicKey;
    $rootScope.isKeysLoaded = true;
    ipCookie($rootScope.username, { 
      privateKey: $rootScope.user.privateKey,
      publicKey: $rootScope.user.publicKey,
      passphrase: $rootScope.user.passphrase,
      passphraseText: $rootScope.profile.passphraseText
    }, { expires: 10000 });
  };

  /**************************************
   * Watchers
   *************************************/

  $scope.isLoggedView = function() {
    return $scope.viewsNotLogged.indexOf($scope.route) > -1 ? false : true;
  };

  $scope.$on('$locationChangeStart', function(event, next, current) { 
    //console.log('Changing direction');
    // console.log(current);
    //console.log(next);
    $scope.route =  next.slice(next.indexOf('#')+1, next.length);

    if (($scope.isLoggedView()) && !$scope.isLogged()) {
      $location.path('login');
      return;
    }
    $scope.isLoaded = true;
  });

  /**************************************
   * UTILS
   *************************************/

  $scope.goToPage = function(page) {
    $location.path(page);
  };

  $scope.selectTab = function(index, title, template) {
    if (typeof index === 'number') {
      $rootScope.selectedIndex = index;
    }
    else if (typeof index === 'string') {
      switch(index) {
        case 'profile': 
        case 'friends':
          $rootScope.$emit('addSpecialTab', index, title, template);
          break;
      }
    }
  };

  $rootScope.getItemFromArray = function (array, id, properties) {
    var found = null,
        foundIndex = null;

    var selector = 'id';
    if (properties && properties.id) {
      selector = properties.id;
    }

    var isIndex = false;
    if (properties && properties.isIndex) {
      isIndex = properties.isIndex;
    }

    array.forEach(function(item, index) {
      if (item[selector] === id) {
        found = item;
        foundIndex = index;
      }
    });

    return isIndex ? foundIndex : found;
  };

  $rootScope.showError = function(error) {
    $mdDialog.show(
      $mdDialog.alert()
        .title('An error has occured!')
        .content(error)
        .ok('Got it!')
    );

    console.error(error);

  };

  $rootScope.showToastMessage = function(message) {
    $mdToast.show(
      $mdToast.simple()
        .content(message)
        .position('bottom left')
        .hideDelay(2100)
    );
  };

}]);
