'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',

  'myApp.login',
  'myApp.view1',
  'myApp.view2',
  'myApp.services',
  'myApp.version',

  //'restangular',
  'ui.bootstrap',
  'btford.socket-io',
  'ipCookie',
  //'chieffancypants.loadingBar',
  'gettext',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}])
.controller('GlobalController', ['$scope', '$rootScope', '$location', 'gettextCatalog',
  function($scope, $rootScope, $location, gettextCatalog) {

  $scope.lang = "en";
  $rootScope.user = null;

  $scope.setLanguage = function(language) {
    $scope.lang = language;
    gettextCatalog.currentLanguage = language;
  };

  $scope.$on('$routeChangeStart', function(next, current) { 
    console.log(current.$$route.originalPath);

    if ((current.$$route.originalPath !== '/login' &&
        current.$$route.originalPath !== '/register') && !$scope.isLogged()) {
      $location.path('login');
    }
  });

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

}]);