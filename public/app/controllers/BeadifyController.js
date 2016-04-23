angular.module('beads3d').controller('BeadifyController', function($scope, $location, $routeParams, Loader, Upload, Socket, $interval, ThreeJSHelpers) {    
  $scope.pos = new THREE.Vector3();
  $scope.sca = new THREE.Vector3();
  $scope.rot = new THREE.Euler(0, 0, 0, 'XYZ');
  $scope.camstart = new THREE.Vector3(0,0,0);
  $scope.camend = new THREE.Vector3(0,0,0);
  $scope.mmmodelpos = new THREE.Vector3(0,0,0);
  $scope.mmmodelsca = new THREE.Vector3(1,1,1);
  $scope.mmmodelradius = 1;
  $scope.mmmodelcube = null;
  $scope.boxpos = new THREE.Vector3(-0.5, -0.5, -0.5);
  var R = 2;
  var alpha = 0;
  $interval(function() {
    alpha += 1 * Math.PI / 180;
    var sin = Math.sin(alpha);
    $scope.pos = new THREE.Vector3(R * Math.cos(alpha), 0, R*sin);
    $scope.sca = new THREE.Vector3(sin, sin, sin);
  }, 50);
  
  var modelName = $routeParams.model;
  var loader = {
    model: new THREE.Object3D(),
    cube: new THREE.Object3D()
  };
  Loader.loadOBJ('/uploads/'+modelName)
    .then(function(obj) {
      var bbox = new THREE.Box3().setFromObject(obj);
      var size = bbox.size();
      var scale = 1/Math.max(size.x, size.y, size.z);
      $scope.mmmodel = obj;
      $scope.mmmodelpos = new THREE.Vector3(-bbox.min.x-size.x/2, -bbox.min.y-size.y/2, -bbox.min.z-size.z/2);
      $scope.mmmodelsca = new THREE.Vector3(scale, scale, scale);
      /*
      //TOOOO SLOW
      var bsphere = ThreeJSHelpers.getBoundingSphereFromObject(obj);
      var scale = 1/(bsphere.radius);
      loader.model.scale.set(scale, scale, scale);
      $scope.mmmodel = obj;
      updateTransformerScene();
      $scope.mmmodelpos = bsphere.center.clone().negate();
      $scope.mmmodelsca = new THREE.Vector3(scale, scale, scale);
      $scope.mmmodelradius = 1;
      */
    });
  Loader.loadOBJ('/utils/invertedCube.obj')
    .then(function(obj) {
      var material = new THREE.MeshLambertMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.1
      });
      obj.traverse(function(node) {
        node.material = material;
      });
      $scope.mmmodelcube = obj;
    });
});