angular.module('beads3d').directive('threejsGroup', function() {
  return {
    restrict: 'E',
    scope: {
      position: '=?',
      scale: '=?',
      rotation: '=?'
    },
    require: ['?^threejsGroup', '?^threejsLayer'],
    controller: function($scope) {
      $scope.group = new THREE.Object3D();
      this.addObject = function(obj) { $scope.scene.add(obj); };
      this.removeObject = function(obj) { $scope.scene.remove(obj); };
      
      ['position', 'scale'].forEach(function(element) {
        $scope.$watch(element, function(newValue) {
          if(newValue)
            $scope.group[element].set(newValue.x, newValue.y, newValue.z);
        });
      });
      $scope.$watch('rotation', function(newValue) {
        if(newValue)
          $scope.group.rotation.set(newValue.x, newValue.y, newValue.z, newValue.order);
      });
    },
    link: function($scope, element, attr, parentCtrls) {
      var parentCtrl = parentCtrls[0] || parentCtrls[1];
      parentCtrl.addObject($scope.group);
      $scope.$on('$destroy', function() { parentCtrl.removeObject($scope.group); });
    },
    replace: true,
    transclude: true,
    template: '<span ng-transclude/>'
  };
});