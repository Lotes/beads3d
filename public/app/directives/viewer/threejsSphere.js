angular.module('beads3d').directive('threejsSphere', function() {
  return {
    restrict: 'E',
    scope: {
      position: '=?',
      scale: '=?',
      rotation: '=?'
    },
    require: ['?^threejsGroup', '?^threejsLayer'],
    controller: function($scope) {
      var geometry = new THREE.SphereGeometry(1, 20, 20);
      var material = new THREE.MeshBasicMaterial({
        color: 0x0000ff, 
        transparent: true, 
        opacity: 1,
        depthWrite: true
      });
      $scope.sphere = new THREE.Mesh(geometry, material);
      
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