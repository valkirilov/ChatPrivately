'use strict';

angular.module('myApp.victoria', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/victoria', {
    templateUrl: 'victoria/victoria.html',
    controller: 'VictoriaCtrl'
  });
}])

.controller('VictoriaCtrl', ['$scope', '$rootScope', '$http', 'UserService',
  function($scope, $rootScope, $http, UserService) {

    $scope.message = "nothing..";

    $scope.deleteRooms = function() {
      $http.post('/api/rooms/victoria').then(function(response) {
        $scope.message = response.data.message;
      });
    };

    $scope.deleteMessages = function() {
      $http.post('/api/messages/victoria').then(function(response) {
        $scope.message = response.data.message;
      });
    };

    $scope.deleteUsers = function() {
      $http.post('/api/users/victoria').then(function(response) {
        $scope.message = response.data.message;
      });
    };

    $scope.logout = function() {
      UserService.logout(function() {
        $location.path('login');
      });
    };


}]);