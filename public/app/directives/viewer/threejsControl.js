angular.module('beads3d').directive('threejsControl', function() {
  return {
    restrict: 'E',
    scope: {
      'isLoading': '='
    },
    controller: function($scope) {
      $scope.layers = [];
      this.addLayer = function(scene) { $scope.layers.push(scene); };
      this.removeLayer = function(scene) { $scope.layers = $scope.layers.filter(function(layer) { return layer !== scene; }); };
    },
    link: function($scope, element, attr) {
      var div = element[0];
      var camera, renderer;
      
      function animate() {
        requestAnimationFrame(animate);
        $scope.layers.forEach(function(layer) {
          renderer.render(layer, camera);
        });
      }
      function onWindowResize() {
        camera.aspect = div.clientWidth / div.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(div.clientWidth, div.clientHeight);
      }
    
      //camera
      camera = new THREE.PerspectiveCamera(45, div.clientWidth / div.clientHeight, 1, 2000);
      camera.position.set(2, 2, 2);
      camera.lookAt(new THREE.Vector3());
      
      //renderer
      renderer = new THREE.WebGLRenderer({
        alpha: true
      });
      renderer.setPixelRatio(div.devicePixelRatio);
      renderer.setClearColor(0xff0000, 1);
      div.appendChild(renderer.domElement);
      
      //window events
      window.addEventListener('resize', onWindowResize, false);
      
      //start animation loop
      animate();
      onWindowResize();
    },
    replace: true,
    transclude: true,
    template: '<div class="viewer"><span us-spinner ng-if="isLoading"></span><span style="display: none" ng-transclude/></div>'
  };
});