'use strict';

angular.module('myApp.services.posts-service', [])
.factory('PostsService', function ($http, Restangular) {
  
  var posts;
  var basePosts = Restangular.all('api/posts');

  var fetch = function(user) {
    posts = Restangular.all('api/posts/'+user).getList();
    return posts;
  };

  var fetchMy = function(user) {
    posts = Restangular.all('api/posts/my/'+user).getList();
    return posts;
  };

  var create = function(user, message) {
    var promise = $http.post('/api/posts/', { userId: user, message: message });

    return promise;
  };


  return {
    fetch: fetch,
    fetchMy: fetchMy,
    create: create
  };
});