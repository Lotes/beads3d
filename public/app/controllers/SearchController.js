angular.module('beads3d').controller('SearchController', function($scope, $routeParams, $location) {
  $scope.pattern = $routeParams.pattern ? decodeURIComponent($routeParams.pattern) : '';
  $scope.results = [];
  //TODO
  for(var index=0; index<10; index++)
      $scope.results.push($scope.pattern+$scope.results.length);
  $scope.search = function() {
    $location.path('/search/'+encodeURIComponent($scope.pattern));
  };
  $scope.searchMore = function() {
    for(var index=0; index<10; index++)
      $scope.results.push($scope.pattern+$scope.results.length);
  };
});