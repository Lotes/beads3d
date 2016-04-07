module.exports = function(app) {
  app.directive('connectButton', function($http) {
    return {
      restrict: 'E',
      scope: {},
      link: function($scope, element, attr) {
        $scope.loggedIn = false;
        $scope.clientId = null;
        
        $scope.$on('event:google-plus-signin-success', function (event, authResult) {
          $http
            .post('/auth/google/callback', { code: authResult.code })
            .success(function(data) {
              $scope.loggedIn = true;
              $scope.profile = {
                name: data.name,
                image: data.photoUrl
              };
            });
        });
        $scope.$on('event:google-plus-signin-failure', function (event, authResult) {
          alert('Failed to login!');
        });
        
        $http
          .get('/auth/google/client-id')
          .success(function(data) {
            $scope.clientId = data.clientId;
          });
        $scope.profile = {
          name: "Nobody",
          image: null
        };
        $scope.logout = function() {
          $http
            .get('/logout')
            .success(function() {
              $scope.loggedIn = false;
            });
        };
      },
      replace: true,
      templateUrl: 'views/connectButton.html'
    };
  });
};