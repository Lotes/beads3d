angular.module('beads3d', [])
  .controller('MainController', function($scope, $q) {
    $scope.object = null;
  
    $scope.load = function(url) {
      var deferred = $q.defer();
      var manager = new THREE.LoadingManager();
  
      var loader = new THREE.OBJLoader( manager );
      loader.load(url, function (object) {
        var bbox = new THREE.Box3().setFromObject(object);
        var size = bbox.size();
        if(!isFinite(size.length())) {
          deferred.reject(new Error('No mesh!'));
          $scope.object = null;
        } else {
          var maxLength = Math.max(size.x, size.y, size.y);
          var scale = 1/maxLength;
          //normalize size and position
          object.scale.set(scale, scale, scale);
          object.position.set(
            -bbox.min.x*scale, 
            -bbox.min.y*scale, 
            -bbox.min.z*scale
          );
          //return
          $scope.object = object;        
          deferred.resolve(object);
        }
        $scope.$apply();
      }, function(xhr) {
        if ( xhr.lengthComputable ) {
					var percentComplete = xhr.loaded / xhr.total * 100;
					deferred.notify(percentComplete);
				}
      }, function(xhr) {
        deferred.reject(new Error(xhr.responseText));
      });
  
      return deferred.promise;
    };
  })
  .directive('viewer', function() {
    return {
      restrict: 'E',
      scope: {
        'object': '='
      },
      link: function(scope, element, attr) {
        var camera, scene, renderer, controls, div;
        div = element[0];
      
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
      
        function onWindowResize() {
          camera.aspect = div.clientWidth / div.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(div.clientWidth, div.clientHeight);
        }
      
				camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
				camera.position.z = 2;

				// scene
				scene = new THREE.Scene();
				var ambient = new THREE.AmbientLight(0xFFFFFF);
				scene.add(ambient);
        
				//renderer
				renderer = new THREE.WebGLRenderer();
				renderer.setPixelRatio(div.devicePixelRatio);
        renderer.setClearColor(0x8080ff, 1);
				onWindowResize();
				div.appendChild(renderer.domElement);

				//controls
        controls = new THREE.OrbitControls( camera, renderer.domElement );
				controls.enableDamping = false;
				controls.enableZoom = true;

				//window events
				window.addEventListener('resize', onWindowResize, false);
        
        //start animation loop
        animate();
        
        scope.$watch('object', function(newValue, oldValue) {
          if(oldValue)
            scene.remove(oldValue);
          
          if(newValue) {
            scene.add(newValue);
            
            var bbox = new THREE.Box3().setFromObject(newValue);
            controls.target.set(
              (bbox.min.x + bbox.max.x)/2,
              (bbox.min.y + bbox.max.y)/2,
              (bbox.min.z + bbox.max.z)/2
            );
          }
        });
      },
      replace: true,
      template: '<div class="viewer"/>'
    };
  })
  ;