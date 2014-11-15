'use strict';

angular.module('myApp.services.user-service', [])
.factory('UserService', function ($http, ipCookie) {
  
  var login = function(name, password) {
    console.log('TODO ' + name + ' ' + password);

    // TODO: Validate the input

    var promise = $http.post('/api/users/login', {
      name: name,
      password: password
    });

    promise.then(function(response) {
      if (response.data.success === 'true') {
        console.log('Set up token');
        $http.defaults.headers.common['x-access-token'] = response.data.access_token;
        ipCookie('user', response.data, { expires: 21 });
      }
    });

    return promise;
  };

  return {
    login: login
  };
});