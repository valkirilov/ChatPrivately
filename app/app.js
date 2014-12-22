'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'ngMaterial',

  'myApp.login',
  'myApp.dashboard',
  'myApp.view2',
  'myApp.message-options',
  'myApp.services',
  'myApp.directives',
  'myApp.version',
  'myApp.victoria',

  'restangular',
  'ui.bootstrap',
  'btford.socket-io',
  'ipCookie',
  'gettext',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/dashboard'});
}])
.controller('GlobalController', ['$scope', '$rootScope', '$location', 'gettextCatalog', 'UserService', 'RoomsService', '$timeout', '$mdSidenav', '$mdDialog', '$mdToast', 'chatSocket',
  function($scope, $rootScope, $location, gettextCatalog, UserService, RoomsService, $timeout, $mdSidenav, $mdDialog, $mdToast, chatSocket) {

  /***********************************************
   * Init variables
   ***********************************************/

  $scope.lang = "en";
  $rootScope.user = null;
  $rootScope.profile = null;
  $scope.route;
  $scope.isLoaded = false;

  $scope.viewsNotLogged = ['/login', '/register', '/logo'];

  $rootScope.friends = {};
  $rootScope.rooms = {};

  // Getting the friends an listing them as object
  UserService.fetchFriends().then(function(data) {
    data.forEach(function(friend) {
      $rootScope.friends[friend.id] = friend;
    });
  });

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
  $scope.openKeys = function(ev) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'alerts/alert-keys.tmpl.html',
      targetEvent: ev,
    })
    .then(function(answer) {
      $scope.alert = 'You said the information was "' + answer + '".';
    }, function() {
      $scope.alert = 'You cancelled the dialog.';
    });
  };

  /************************************
   * CHAT ROOMS
   ************************************/

  $scope.chatFriend = function(friendId) {
    var participants = [$scope.user.id, friendId];
    RoomsService.create(participants, $rootScope.user.id, $rootScope.friends).then(function(response) {
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
    });
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
        .title('This is an alert title')
        .content('You can specify some description text in here.')
        .ariaLabel('Password notification')
        .ok('Got it!')
    );

    console.error(error);

  };

  $rootScope.showToastMessage = function(message) {
    console.log(message);
    $mdToast.show(
      $mdToast.simple()
        .content(message)
        .position('bottom left')
        .hideDelay(2100)
    );
  };

}]);
