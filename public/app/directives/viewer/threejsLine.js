angular.module('beads3d').directive('threejsLine', function() {
  return {
    restrict: 'E',
    scope: {
      color: '=?',
      from: '=?',
      to: '=?'
    },
    require: ['?^threejsGroup', '?^threejsLayer'],
    controller: function($scope) {},
    link: function($scope, element, attr, parentCtrls) {
      var wrapper = new THREE.Object3D();
      var line = null;
    
      if($scope.from == undefined) $scope.from = new THREE.Vector3(0, 0, 0);
      if($scope.to == undefined) $scope.to = new THREE.Vector3(0, 1, 0);
      if($scope.color == undefined) $scope.color = 0xffffff;
      
      function update() {
        if(line != null) wrapper.remove(line);
        var material = new THREE.LineBasicMaterial({
          color: $scope.color
        });
        var geometry = new THREE.Geometry();
        geometry.vertices.push($scope.from, $scope.to);
        line = new THREE.Line(geometry, material);
        wrapper.add(line);
      }
    
      var parentCtrl = parentCtrls[0] || parentCtrls[1];
      parentCtrl.addObject(wrapper);
      $scope.$on('$destroy', function() { parentCtrl.removeObject(wrapper); });
      
      //model
      ['from', 'to', 'color'].forEach(function(element) {
        $scope.$watch(element, update);
      });      
      update();
    },
    replace: true,
    template: '<span/>'
  };
});