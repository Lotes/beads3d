angular.module('beads3d').directive('threejsSphere', function() {
  return {
    restrict: 'E',
    scope: {
      position: '=?',
      scale: '=?',
      rotation: '=?',
      radius: '=?',
      segments: '=?',
      color: '=?',
      opacity: '=?',
      depthWrite: '=?'
    },
    require: ['?^threejsGroup', '?^threejsLayer'],
    controller: function($scope) {
      if($scope.radius === undefined) $scope.radius = 1;
      if($scope.segments === undefined) $scope.segments = 20;
      if($scope.color === undefined) $scope.color = 0xffffff;
      if($scope.opacity === undefined) $scope.opacity = 1;
      if($scope.depthWrite === undefined) $scope.depthWrite = true;
      $scope.geometry = new THREE.SphereGeometry($scope.radius, $scope.segments, $scope.segments);
      $scope.material = new THREE.MeshBasicMaterial({
        color: $scope.color, 
        transparent: $scope.opacity < 1, 
        opacity: $scope.opacity,
        depthWrite: $scope.depthWrite
      });
      $scope.sphere = new THREE.Mesh($scope.geometry, $scope.material);
      //geometry
      ['segments', 'radius'].forEach(function(element) {
        $scope.$watch(element, function() {
          $scope.geometry = new THREE.SphereGeometry($scope.radius, $scope.segments, $scope.segments);
          $scope.sphere.geometry = $scope.geometry;
        });
      });
      //material
      ['color', 'opacity', 'depthWrite'].forEach(function(element) {
        $scope.$watch(element, function() {
          $scope.material = new THREE.MeshBasicMaterial({
            color: $scope.color, 
            transparent: $scope.opacity < 1, 
            opacity: $scope.opacity,
            depthWrite: $scope.depthWrite
          });
          $scope.sphere.material = $scope.material;
        });
      });
      //sphere
      ['position', 'scale'].forEach(function(element) {
        $scope.$watch(element, function(newValue) {
          if(newValue)
            $scope.sphere[element].set(newValue.x, newValue.y, newValue.z);
        });
      });
      $scope.$watch('rotation', function(newValue) {
        if(newValue)
          $scope.sphere.rotation.set(newValue.x, newValue.y, newValue.z, newValue.order);
      });
    },
    link: function($scope, element, attr, parentCtrls) {
      var parentCtrl = parentCtrls[0] || parentCtrls[1];
      parentCtrl.addObject($scope.sphere);
      $scope.$on('$destroy', function() { parentCtrl.removeObject($scope.sphere); });
    },
    replace: true,
    template: '<span/>'
  };
});