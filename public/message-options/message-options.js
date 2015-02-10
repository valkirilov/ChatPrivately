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

    var clickedItem = $scope.items[$index];
    if ($index !== undefined) {
      $mdBottomSheet.hide(clickedItem);
    }
    else {
      $mdBottomSheet.hide('Nothing');
    }
  };

  $scope.avatarAddedHandle = function($file, $event) {
    var file = $file.file;
    var reader = new FileReader();
    
    reader.onload = (function(theFile) {
      return function(e) {
        $rootScope.sendImage($file.file, e.target.result);
      };
    })(file);

    // Read in the image file as a data URL.
    reader.readAsDataURL(file);
  }; 


});