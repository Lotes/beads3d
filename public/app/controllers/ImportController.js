angular.module('beads3d').controller('ImportController', function($scope, Upload, $window, Loader, $location) {
  $scope.pos = new THREE.Vector3();
  $scope.sca = new THREE.Vector3();
  $scope.rot = new THREE.Euler(0, 0, 0, 'XYZ');
  $scope.mmmodelradius = 0;
  $scope.mmmodelpos = new THREE.Vector3(0,0,0);
  $scope.mmmodelsca = new THREE.Vector3(1,1,1);
  $scope.boxpos = new THREE.Vector3(-0.5, -0.5, -0.5);
  $scope.light1pos = new THREE.Vector3(0,0,0);
  $scope.light2pos = new THREE.Vector3(0,0,0);
  $scope.cameraChange = function(camera) {
    $scope.light1pos = new THREE.Vector3(-4,0,0).applyMatrix4(camera.matrixWorld);
    $scope.light2pos = new THREE.Vector3(+4,0,0).applyMatrix4(camera.matrixWorld);
  };
  
  $scope.showError = function(message) {
    alert(message); //TODO beautify dialog
  };
  $scope.selection = null;
  $scope.modelIsLoading = false;
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
    $scope.modelIsLoading = true;
    Loader.loadOBJ('/uploads/'+$scope.selection.id+'/'+$scope.selection.path)
      .then(function(obj) {
        var bbox = new THREE.Box3().setFromObject(obj);
        var size = bbox.size();
        var scale = 1/Math.max(size.x, size.y, size.z);
        $scope.model = obj;
        $scope.mmmodelpos = new THREE.Vector3(-bbox.min.x-size.x/2, -bbox.min.y-size.y/2, -bbox.min.z-size.z/2);
        $scope.mmmodelsca = new THREE.Vector3(scale, scale, scale);
        $scope.modelIsLoading = false;
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