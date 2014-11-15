'use strict';

angular.module('myApp.login', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {
    templateUrl: 'login/login.html',
    controller: 'LoginCtrl'
  });

  $routeProvider.when('/register', {
    templateUrl: 'login/register.html',
    controller: 'LoginCtrl'
  });
}])

.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location', 'UserService', 'ipCookie',
  function($scope, $rootScope, $http, $location, UserService, ipCookie) {

  $scope.input = {
    name: null,
    password: null,
    username: null,
    email: null
  };

  $scope.login = function() {

    var name = angular.copy($scope.input.name),
        password = angular.copy($scope.input.password);
    
    UserService.login(name, password).then(function(response) {
      $rootScope.user = {
        username: response.data.username,
        email: response.data.email,
        access_token: response.data.access_token
      };

      $location.path('view1');
    });

  };

  $scope.register = function() {
    var username = angular.copy($scope.input.username),
        email = angular.copy($scope.input.email),
        password = angular.copy($scope.input.password);
    
    UserService.register(username, email, password).then(function(response) {
      $location.path('login');
    });
  }

  $scope.test = function () {
    $http.get('/api/users/').then(function(response) {
      console.log(response);
    });
  };

  $scope.checkForLogin = function() {
    var rememberedUser = ipCookie('user');
    if (rememberedUser) {
      $rootScope.user = rememberedUser;
      $location.path('view1');
    }
  };
  $scope.checkForLogin();


}]);