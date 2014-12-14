'use strict';

angular.module('myApp.victoria', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/victoria', {
    templateUrl: 'victoria/victoria.html',
    controller: 'VictoriaCtrl'
  });
}])

.controller('VictoriaCtrl', ['$scope', '$rootScope', '$http',
  function($scope, $rootScope, $http) {

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


}]);