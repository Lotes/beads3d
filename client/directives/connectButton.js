module.exports = function(app) {
  app.directive('connectButton', function($http) {
    return {
      restrict: 'E',
      scope: {},
      link: function($scope, element, attr) {
        $scope.user = USER;
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
            });
        };
      },
      replace: true,
      templateUrl: 'views/connectButton.html'
    };
  });
};