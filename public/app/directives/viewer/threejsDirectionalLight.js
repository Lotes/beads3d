angular.module('beads3d').directive('threejsDirectionalLight', function() {
  return {
    restrict: 'E',
    scope: {
      position: '=?'
    },
    require: ['?^threejsGroup', '?^threejsLayer'],
    controller: function($scope) {
      $scope.light = new THREE.DirectionalLight(0xFFFFFF, 1);
    },
    link: function($scope, element, attr, parentCtrls) {
      if($scope.position == undefined) $scope.position = new THREE.Vector3(0, 0, 0);
      var parentCtrl = parentCtrls[0] || parentCtrls[1];
      parentCtrl.addObject($scope.light);
      $scope.$on('$destroy', function() { parentCtrl.removeObject($scope.light); });
      //object
      ['position'].forEach(function(element) {
        $scope.$watch(element, function(newValue) {
          if(newValue)
            $scope.light[element].set(newValue.x, newValue.y, newValue.z);
        });
      });
    },
    replace: true,
    template: '<span/>'
  };
});