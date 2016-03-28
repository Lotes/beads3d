module.exports = function(app) {
  app.controller('MainController', function($scope, $location) {
    $scope.searchParameters = {};
    $scope.searchParameters.pattern = '';
    $scope.search = function() {
      $location.path('/search/'+encodeURIComponent($scope.searchParameters.pattern));
    };
  });
};