'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', 'chatSocket', function($scope, chatSocket) {

  $scope.messages = [];

  $scope.send = function() {

    $scope.username = 'nick';
    var message = angular.copy($scope.message);


    chatSocket.emit('message', $scope.username, message);
    console.log('Sending: ' + message);
    $scope.message = '';
  };

  $scope.$on('socket:broadcast', function(event, data) {
    if (!data.content) {
      return;
    }

    console.log(data);

    $scope.messages.push(data);
  });

}]);