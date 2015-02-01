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
    passphrase: null,
    username: null,
    email: null
  };
  $scope.isGeneratingKeys = 0;
  $scope.isLogoVissible = false;
  $scope.keySize = 1024;

  $scope.init = function() {
    $timeout(function() {
      $scope.isLogoVissible = true;   
      angular.element('.form-input').addClass('bounceInUp').addClass('animated');
    }, 1300);
  };

  $scope.login = function() {

    var name = ($scope.input.name !== null) ? angular.copy($scope.input.name) : angular.copy($scope.input.username),
        password = angular.copy($scope.input.password);
        //passphareText = angular.copy($scope.input.passphrase);
    
    UserService.login(name, password).then(function(response) {
      $rootScope.user = {
        id: response.data.id,
        username: response.data.username,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        access_token: response.data.access_token,
        privateKey: "",
        publicKey: response.data.publicKey,
        passphrase: response.data.passphrase,
      };
    
      $scope.checkPrivateKey();
      $scope.enableCrypt();

      $rootScope.profile = angular.copy($rootScope.user);
      $location.path('dashboard');
    });

  };

  $scope.register = function() {
    var username = angular.copy($scope.input.username),
        email = angular.copy($scope.input.email),
        password = angular.copy($scope.input.password),
        passphrase = angular.copy($scope.input.passphrase);

    var keys = generatePrivateAndPublicKeys(passphrase);
    
    UserService.register(username, email, password, passphrase, keys).then(function(response) {
      $scope.isGeneratingKeys = 2;

      //$scope.input.privateKey = keys.privateKey;
      $scope.input.publicKey = keys.publicKey;
      ipCookie(username, { 
        publicKey: keys.publicKey,
        passphraseText: passphrase,
        passphrase: CryptoJS.MD5(passphrase).toString()
      }, { expires: 10000 });
      //$location.path('login');
    });
  };  

  var generatePrivateAndPublicKeys = function(passphrase) {
    $scope.isGeneratingKeys = 1;

    var RSAKey = cryptico.generateRSAKey(CryptoJS.MD5(passphrase).toString(), $scope.keySize),
        publicKey = cryptico.publicKeyString(RSAKey);

    var keys = {
      publicKey: publicKey,
      privateKey: 'remove-me-from-the-model'
    };

    return keys;
  };

  $scope.checkPrivateKey = function() {
    if (ipCookie($rootScope.user.username) 
        && ipCookie($rootScope.user.username).publicKey
        && ipCookie($rootScope.user.username).passphrase 
        && ipCookie($rootScope.user.username).passphraseText) {

      $rootScope.user.publicKey = ipCookie($rootScope.user.username).publicKey;
      $rootScope.user.passphrase = ipCookie($rootScope.user.username).passphrase;
      $rootScope.user.passphraseText = ipCookie($rootScope.user.username).passphraseText;

      $rootScope.isKeysLoaded = true;
      //$rootScope.showToastMessage('Private Key found and loaded.');
    }
  };

  $scope.checkForLogin = function() {
    var rememberedUser = ipCookie('user');
    if (rememberedUser) {
      $rootScope.user = rememberedUser;

      $scope.checkPrivateKey();
      $scope.enableCrypt();

      $rootScope.profile = angular.copy($rootScope.user);

      $rootScope.rooms = RoomsService.fetch($rootScope.user.id);
      $location.path('dashboard');

      //console.log($rootScope.user);
    }
  };

  $scope.enableCrypt = function() {
    if (!$rootScope.isKeysLoaded)
      return;

    // Lets' genereate our RSA Key
    $rootScope.user.privateKey = cryptico.generateRSAKey($rootScope.user.passphrase, $scope.keySize);

    var text = "Matt, I need you to help me with my Starcraft strategy.";
    var encryptedTest = cryptico.encrypt(text, $rootScope.user.publicKey);
    var encryptedTestCipher = encryptedTest.cipher;
    var decriptedTest = cryptico.decrypt(encryptedTestCipher, $rootScope.user.privateKey);

    if (text !== decriptedTest.plaintext) {
      $rootScope.isKeysLoaded = false;
      $rootScope.showToastMessage("Error: Private Key is not valid!");
    }
    else {
      $rootScope.showToastMessage("Private Key is valid!"); 
    }

    // Encrypt the passphrase
    
  };

  $scope.checkForLogin();

  $scope.init();

}]);