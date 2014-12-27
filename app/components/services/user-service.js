'use strict';

angular.module('myApp.services.user-service', [])
.factory('UserService', function ($http, ipCookie, Restangular) {
  
  var users;
  var baseUsers = Restangular.all('api/users');

  var fetchFriends = function() {
    users = baseUsers.getList();
    return users;
  };

  var login = function(name, password) {

    // TODO: Validate the input

    var promise = $http.post('/api/users/login', {
      name: name,
      password: password
    });

    promise.then(function(response) {
      if (response.data.success === 'true') {
        $http.defaults.headers.common['x-access-token'] = response.data.access_token;
        ipCookie('user', response.data, { expires: 21 });
      }
    });

    return promise;
  };

  var logout = function(callback) {
    $http.defaults.headers.common['x-access-token'] = '';
    ipCookie.remove('user');
    callback();
  };

  var register = function(username, email, password, keys) {

    // TODO: Validate the input

    var promise = $http.post('/api/users/register', {
      username: username,
      email: email,
      password: password,
      privateKey: keys.privateKey,
      publicKey: keys.publicKey
    });

    return promise;
  };

  var saveProfileDetails = function(user) {
    var promise = $http.post('/api/users/update/profile', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

    return promise;
  };

  return {
    login: login,
    register: register,
    logout: logout,
    fetchFriends: fetchFriends,
    saveProfileDetails: saveProfileDetails
  };
});