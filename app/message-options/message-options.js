'use strict';

angular.module('myApp.message-options', [])
.controller('MessageOptionsCtrl', function($scope, $mdBottomSheet) {
  $scope.items = [
    { name: 'Image', icon: 'fa-image' },
    { name: 'Draw', icon: 'fa-pencil' },
    { name: 'Play', icon: 'fa-gamepad' },
    { name: 'Customize', icon: 'fa-gears' },
  ];
  $scope.listItemClick = function($index) {
    var clickedItem = $scope.items[$index];
    $mdBottomSheet.hide(clickedItem);
  };
});