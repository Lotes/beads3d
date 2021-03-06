angular.module('beads3d').directive('threejsControl', function() {
  return {
    restrict: 'E',
    require: 'threejsControl',
    scope: {
      isLoading: '=?',
      backgroundColor: '=?'
    },
    controller: function($scope, $element) {
      var div = $element[0];
      if($scope.backgroundColor === undefined) $scope.backgroundColor = 0xffffff;
      if($scope.isLoading === undefined) $scope.isLoading = false;
      $scope.layers = [];
      this.addLayer = function(scene) { $scope.layers.push(scene); };
      this.removeLayer = function(scene) { $scope.layers = $scope.layers.filter(function(layer) { return layer !== scene; }); };
      this.on = function(eventName, callback) {
        div.addEventListener(eventName, callback, false);
      };
      this.off = function(eventName, callback) {
        div.removeEventListener(eventName, callback, false);
      };
      this.getWidth = function() { return div.clientWidth; };
      this.getHeight = function() { return div.clientHeight; };
      //camera
      $scope.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 1, 2000);
      $scope.camera.position.set(2, 2, 2);
      $scope.camera.lookAt(new THREE.Vector3());
      //helpers
      this.getCamera = function() { return $scope.camera; };
      this.getLeft = function() { return div.offsetLeft; };
      this.getTop = function() { return div.offsetTop; };
    },
    link: function($scope, element, attr, controller) {
      var div = element[0];
      var renderer;
      
      function animate() {
        requestAnimationFrame(animate);
        renderer.clearTarget(null, true, false, false);
        $scope.layers.forEach(function(layer) {
          renderer.clearTarget(null, false, true, true);
          renderer.render(layer, $scope.camera);
        });
      }
      function onWindowResize() {
        $scope.camera.aspect = controller.getWidth() / controller.getHeight();
        $scope.camera.updateProjectionMatrix();
        renderer.setSize(controller.getWidth(), controller.getHeight());
      }
      
      //renderer
      renderer = new THREE.WebGLRenderer({
        alpha: true
      });
      renderer.autoClear = false;
      renderer.setPixelRatio(div.devicePixelRatio);
      renderer.setClearColor($scope.backgroundColor, 1);
      div.appendChild(renderer.domElement);
      $scope.$watch('backgroundColor', function(newValue) {
        renderer.setClearColor(newValue, 1);
      });
      
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