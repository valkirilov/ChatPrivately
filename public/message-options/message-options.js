'use strict';

angular.module('myApp.message-options', [])
.controller('MessageOptionsCtrl', function($scope, $mdBottomSheet) {
  $scope.items = [
    { name: 'Image', icon: 'fa-image' },
    { name: 'Draw', icon: 'fa-pencil' },
    { name: 'Play', icon: 'fa-gamepad' },
    { name: 'Stats', icon: 'fa-bar-chart' },
    { name: 'Gears', icon: 'fa-gears' },
    { name: 'Block', icon: 'fa-user-times' },
  ];
  $scope.listItemClick = function($index) {
    var clickedItem = $scope.items[$index];
    $mdBottomSheet.hide(clickedItem);
  };
});