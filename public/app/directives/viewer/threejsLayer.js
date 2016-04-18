angular.module('beads3d').directive('threejsLayer', function() {
  return {
    restrict: 'E',
    scope: {},
    require: '^threejsControl',
    controller: function($scope) {
      $scope.scene = new THREE.Scene();
      this.addObject = function(obj) { $scope.scene.add(obj); };
      this.removeObject = function(obj) { $scope.scene.remove(obj); };
    },
    link: function($scope, element, attr, parentCtrl) {
      parentCtrl.addLayer($scope.scene);
      $scope.$on('$destroy', function() { parentCtrl.removeLayer($scope.scene); });
    },
    replace: true,
    transclude: true,
    template: '<span ng-transclude/>'
  };
});