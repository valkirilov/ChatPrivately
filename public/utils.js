
/**
 * Here are some Utils functions that are used everywhere
 */

function DialogController($rootScope, $scope, $mdDialog) {
  $scope.profile = $rootScope.profile;

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
  	console.log('Answer');
    $mdDialog.hide(answer);
  };
  $scope.save = function() {
    $rootScope.profile = $scope.profile;
    $mdDialog.hide($rootScope.settingsSaveKeys);
  };
}

function CreateRoomController($rootScope, $scope, $mdDialog) {
  $scope.friends = [];
  $scope.participants = [];

  for (var i in $rootScope.friends) {
    $scope.friends.push($rootScope.friends[i]);
  }

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.createRoom = function() {
    var participants = [];

    $scope.participants.forEach(function(participant) {
      participants.push(participant.id);
    });

    $mdDialog.hide(function() {
      $rootScope.chatFriends(participants);
    });
  };

  $scope.addParticipant = function($event) {
    if ($event.keyCode === 13 && $scope.selected) {
      $scope.participants.push($scope.selected);

      // Remove this friend from the array of available
      $scope.friends = $scope.friends.filter(function(friend) {
        if ($scope.selected.id !== friend.id) {
          return true;
        }
      });

      $scope.selected = null;
    }
  };

}