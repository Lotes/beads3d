angular.module('beads3d').controller('ImportController', function($scope, Upload, $window, Loader, $location) {
  $scope.showError = function(message) {
    alert(message); //TODO beautify dialog
  };
  $scope.selection = null;
  $scope.model = null;
  $scope.uploads = [];
  $scope.refresh = function() {
    Upload.enumerate().then(function(res) {
      $scope.uploads = res.data;
    });
  };
  $scope.$watch('selection', function() {
    $scope.model = null;
    if($scope.selection === null)
      return;
    Loader.loadOBJ('/uploads/'+$scope.selection.id+'/'+$scope.selection.path)
      .then(function(obj) {
        $scope.model = new THREE.Object3D();
        $scope.model.add(obj);
        var bbox = new THREE.Box3().setFromObject(obj);
        var size = bbox.size();
        var scale = 1/Math.max(size.x, size.y, size.z);
        $scope.model.scale.set(scale, scale, scale);
      });
  });
  
  $scope.next = function() {
    $location.path('/beadify/'+$scope.selection.id+'/'+$scope.selection.path);
  };
  $scope.back = function() {
    $location.path('/new');
  };
  
  $scope.refresh();
});