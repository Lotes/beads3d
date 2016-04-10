angular.module('beads3d').directive('uploadButton', function(Loader) {
  return {
    restrict: 'E',
    scope: {
      filter: '@',
      action: '@',
      onUpload: '&',
      onError: '&'
    },
    link: function($scope, element, attr) {
      var uploadForm = element.find('form');
      var uploadButton = element.find('input')[0];
      $scope.uploadFile = null;
      $scope.uploading = false;
      $scope.uploadProgress = 0;
      $scope.upload = function() {
        uploadButton.click(); 
      };
      $scope.$watch('uploadFile', function() {
        if($scope.uploadFile === null)
          return;
        Loader
        .upload($scope.action, $scope.uploadFile)
        .then(function(res) {
          $scope.uploading = false;
          $scope.onUpload({
            res: res
          });
        }, function(e) {
          $scope.uploading = false;
          $scope.onError({
            message: e.message
          });
        }, function(progress) {
          $scope.uploadProgress = progress;
        });
        $scope.uploading = true;
        $scope.uploadFile = null;
        uploadForm.trigger('reset');
      });
    },
    replace: true,
    templateUrl: 'app/views/uploadButton.html'
  };
});