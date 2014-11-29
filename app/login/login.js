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

.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location', 'UserService', 'ipCookie', 'RoomsService',
  function($scope, $rootScope, $http, $location, UserService, ipCookie, RoomsService) {

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
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        access_token: response.data.access_token,
        privateKey: response.data.privateKey,
        publicKey: response.data.publicKey,
      };

      $location.path('view1');
    });

  };

  $scope.register = function() {
    var username = angular.copy($scope.input.username),
        email = angular.copy($scope.input.email),
        password = angular.copy($scope.input.password);

    var keys = generatePrivateAndPublicKeys();
    
    UserService.register(username, email, password, keys).then(function(response) {
      $location.path('login');
    });
  };

  $scope.test = function () {
    $http.get('/api/users/').then(function(response) {
      console.log(response);
    });
  };

  var generatePrivateAndPublicKeys = function() {
    var keys = {},
        keySize = 8,
        crypt = new JSEncrypt({default_key_size: keySize});

    crypt.getKey();
    keys.privateKey = crypt.getPrivateKey();
    keys.publicKey = crypt.getPublicKey();

    return keys;
  };

  $scope.checkForLogin = function() {
    var rememberedUser = ipCookie('user');
    if (rememberedUser) {
      $rootScope.user = rememberedUser;
      $rootScope.rooms = RoomsService.fetch($rootScope.user.id);
      $location.path('view1');

      console.log($rootScope.user);
    }
  };
  $scope.checkForLogin();


}]);