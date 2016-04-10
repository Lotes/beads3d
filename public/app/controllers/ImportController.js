angular.module('beads3d').controller('ImportController', function($scope, Upload, $window, Loader, $location) {
  $scope.showError = function(message) {
    alert(message); //TODO beautify dialog
  };

  /*$scope.selection = {};
  $scope.selection.model = null;
  $scope.selection.model3D = new THREE.Object3D();
  $scope.$watch('selection.model', function() {
    $scope.selection.model3D = new THREE.Object3D();
    if($scope.selection.model === null)
      return;
    Loader.loadOBJ('/uploads/'+$scope.selection.model)
      .then(function(obj) {
        $scope.selection.model3D = new THREE.Object3D();
        $scope.selection.model3D.add(obj);
        var bbox = new THREE.Box3().setFromObject(obj);
        var size = bbox.size();
        var scale = 1/Math.max(size.x, size.y, size.z);
        $scope.selection.model3D.scale.set(scale, scale, scale);
      });
  });*/
  
  $scope.selection = null;
  $scope.uploads = [];
  $scope.refresh = function() {
    Upload.enumerate().then(function(res) {
      $scope.uploads = res.data;
    });
  };
  $scope.$watch('selection', function() {
    /*if($scope.selection)
      alert('GET /'+$scope.selection.id+'/'+$scope.selection.path);*/
  });
  
  $scope.next = function() {
    $location.path('/beadify/'+$scope.selection.model);
  };
  $scope.back = function() {
    $location.path('/new');
  };
  
  $scope.refresh();
});