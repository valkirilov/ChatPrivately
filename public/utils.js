
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