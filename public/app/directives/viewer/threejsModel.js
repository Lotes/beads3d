angular.module('beads3d').directive('threejsModel', function() {
  return {
    restrict: 'E',
    scope: {
      position: '=?',
      scale: '=?',
      rotation: '=?',
      model: '='
    },
    require: ['?^threejsGroup', '?^threejsLayer'],
    controller: function($scope) {
      $scope.wrapper = new THREE.Object3D();
    },
    link: function($scope, element, attr, parentCtrls) {
      if($scope.position == undefined) $scope.position = new THREE.Vector3(0, 0, 0);
      if($scope.scale == undefined) $scope.scale = new THREE.Vector3(1, 1, 1);
      if($scope.rotation == undefined) $scope.rotation = new THREE.Euler(0, 0, 0, 'XYZ');
      var parentCtrl = parentCtrls[0] || parentCtrls[1];
      parentCtrl.addObject($scope.wrapper);
      $scope.$on('$destroy', function() { parentCtrl.removeObject($scope.wrapper); });
      //model
      $scope.$watch('model', function(newValue, oldValue) {
        if(oldValue) $scope.wrapper.remove(oldValue);
        if(newValue) $scope.wrapper.add(newValue);
      });
      //object
      ['position', 'scale'].forEach(function(element) {
        $scope.$watch(element, function(newValue) {
          if(newValue)
            $scope.wrapper[element].set(newValue.x, newValue.y, newValue.z);
        });
      });
      $scope.$watch('rotation', function(newValue) {
        if(newValue)
          $scope.wrapper.rotation.set(newValue.x, newValue.y, newValue.z, newValue.order);
      });
    },
    replace: true,
    template: '<span/>'
  };
});