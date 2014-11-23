'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'ngMaterial',

  'myApp.login',
  'myApp.view1',
  'myApp.view2',
  'myApp.services',
  'myApp.version',

  'restangular',
  'ui.bootstrap',
  'btford.socket-io',
  'ipCookie',
  //'chieffancypants.loadingBar',
  'gettext',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}])
.controller('GlobalController', ['$scope', '$rootScope', '$location', 'gettextCatalog', 'UserService', 'RoomsService', '$timeout', '$mdSidenav', 'chatSocket',
  function($scope, $rootScope, $location, gettextCatalog, UserService, RoomsService, $timeout, $mdSidenav, chatSocket) {

  $scope.lang = "en";
  $rootScope.user = null;
  $scope.route;

  $rootScope.friends = {};
  $rootScope.rooms = $rootScope.user ? RoomsService.fetch($rootScope.user.id) : null;

  UserService.fetchFriends().then(function(data) {
    console.log(data);
    data.forEach(function(friend) {
      $rootScope.friends[friend.id] = friend;
    });
  });

  $scope.setLanguage = function(language) {
    $scope.lang = language;
    gettextCatalog.currentLanguage = language;
  };

  $scope.$on('$routeChangeStart', function(next, current) { 
    //console.log(current.$$route.originalPath);
    $scope.route = current.$$route.originalPath;

    if ((current.$$route.originalPath !== '/login' &&
        current.$$route.originalPath !== '/register') && !$scope.isLogged()) {
      $location.path('login');
    }
  });

  $scope.logout = function() {
    UserService.logout(function() {
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

  /************************************
   * CHAT ROOMS
   ************************************/

  $scope.chatFriend = function(friendId) {
    var participants = [$scope.user.id, friendId];
    RoomsService.create(participants, $rootScope.user.id, $rootScope.friends).then(function(response) {
      console.log(response);
      if (response.data.success === 'true') {
        $rootScope.rooms.push(response.data.room);
      }
    });
  };

  $scope.chatOpen = function(roomId) {
    console.log('Chat open buttin');

    var room = $rootScope.getItemFromArray($rootScope.rooms, roomId);
    console.log(room);
    chatSocket.emit('chatOpen', room.id, room.participants);
  };

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

}]);