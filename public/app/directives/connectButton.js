angular.module('beads3d').directive('connectButton', function($http, $location, Auth) {
  return {
    restrict: 'E',
    scope: {},
    link: function($scope, element, attr) {
      $scope.user = Auth.getUser();
      $scope.clientId = CLIENT_ID;
      
      $scope.$on('event:google-plus-signin-success', function (event, authResult) {
        $http
          .post('/auth/google/callback', { code: authResult.code })
          .success(function(data) {
            $scope.user = {
              id: data.id,
              name: data.name,
              image: data.photoUrl
            };
            Auth.setUser($scope.user);
          });
      });
      $scope.$on('event:google-plus-signin-failure', function (event, authResult) {
        $scope.user = null;
      });
     
      $scope.logout = function() {
        $http
          .get('/logout')
          .success(function() {
            $scope.user = null;
            Auth.setUser(null);
            $location.path('/');
          });
      };
    },
    replace: true,
    templateUrl: 'app/views/connectButton.html'
  };
});