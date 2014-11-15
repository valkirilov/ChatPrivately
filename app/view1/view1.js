'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', '$rootScope', 'chatSocket', function($scope, $rootScope, chatSocket) {

  $scope.messages = [];

  $scope.send = function($event) {
    if ($event && $event.keyCode !== 13) {
      return;
    }

    $scope.username = 'nick';
    var message = angular.copy($scope.message);


    chatSocket.emit('message', $rootScope.user.username, message);
    $scope.message = '';
  };

  $scope.$on('socket:broadcast', function(event, data) {
    if (!data.content) {
      return;
    }

    //console.log(data);

    $scope.messages.push(data);
  });

}]);