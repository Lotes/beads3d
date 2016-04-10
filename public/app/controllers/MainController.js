angular.module('beads3d').controller('MainController', function($scope, $location, $http) {
  $scope.searchParameters = {};
  $scope.searchParameters.pattern = '';
  $scope.search = function() {
    $location.path('/search/'+encodeURIComponent($scope.searchParameters.pattern));
  };
});