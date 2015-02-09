'use strict';

angular.module('myApp.message-options', [])
.controller('MessageOptionsCtrl', function($rootScope, $scope, $mdBottomSheet) {
  $scope.items = [
    { name: 'Draw', icon: 'fa-pencil' },
    { name: 'Play', icon: 'fa-gamepad' },
    { name: 'Stats', icon: 'fa-bar-chart' },
    { name: 'Gears', icon: 'fa-gears' },
    { name: 'Block', icon: 'fa-user-times' },
  ];
  $scope.listItemClick = function($index) {
    $index = $index || 0;
    var clickedItem = $scope.items[$index];
    $mdBottomSheet.hide(clickedItem);
  };

  $scope.avatarAddedHandle = function($file, $event) {
    $rootScope.sendImage($file, $event);
  }; 

});