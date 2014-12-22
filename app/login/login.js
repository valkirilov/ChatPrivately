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

  $routeProvider.when('/logo', {
    templateUrl: 'login/logo.html',
    controller: 'LoginCtrl'
  });
}])

.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location', '$timeout', 'UserService', 'ipCookie', 'RoomsService',
  function($scope, $rootScope, $http, $location, $timeout, UserService, ipCookie, RoomsService) {

  $scope.input = {
    name: null,
    password: null,
    username: null,
    email: null
  };
  $scope.isGeneratingKeys = 0;
  $scope.isLogoVissible = false;

  $scope.init = function() {
    $timeout(function() {
      $scope.isLogoVissible = true;   
      angular.element('.form-input').addClass('bounceInUp').addClass('animated');
    }, 1300);
  };

  $scope.login = function() {

    var name = ($scope.input.name !== null) ? angular.copy($scope.input.name) : angular.copy($scope.input.username),
        password = angular.copy($scope.input.password);
    
    UserService.login(name, password).then(function(response) {
      $rootScope.user = {
        id: response.data.id,
        username: response.data.username,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        access_token: response.data.access_token,
        privateKey: response.data.privateKey,
        publicKey: response.data.publicKey,
      };
      $rootScope.profile = angular.copy($rootScope.user);

      $location.path('dashboard');
    });

  };

  $scope.register = function() {
    var username = angular.copy($scope.input.username),
        email = angular.copy($scope.input.email),
        password = angular.copy($scope.input.password);

    var keys = generatePrivateAndPublicKeys();
    
    UserService.register(username, email, password, keys).then(function(response) {
      $scope.isGeneratingKeys = 2;

      $scope.input.privateKey = keys.privateKey;
      $scope.input.publicKey = keys.publicKey;
      //$location.path('login');
    });
  };  

  var generatePrivateAndPublicKeys = function() {
    $scope.isGeneratingKeys = 1;
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
      $rootScope.profile = angular.copy($rootScope.user);

      $rootScope.rooms = RoomsService.fetch($rootScope.user.id);
      $location.path('dashboard');

      console.log($rootScope.user);
    }
  };
  $scope.checkForLogin();

  $scope.init();

}]);