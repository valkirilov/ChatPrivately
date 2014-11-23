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

  var register = function(username, email, password) {

    // TODO: Validate the input

    var promise = $http.post('/api/users/register', {
      username: username,
      email: email,
      password: password
    });

    return promise;
  };

  return {
    login: login,
    register: register,
    logout: logout,
    fetchFriends: fetchFriends
  };
});