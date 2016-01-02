angular.module('beads3d', ['ui.bootstrap-slider'])
  .controller('MainController', function($scope, $q, $interval) {
    var material = new THREE.MeshBasicMaterial({color: 0x000000 });
	var socket;
  
	$scope.size = 20;
	$scope.maxSize = 100;
  
	$scope.step = 0;
	$scope.stepMax = 100;
    $scope.object = new THREE.Object3D();
	
    $scope.load = function(url) {
      var size = $scope.size;
	  socket = io.connect();
	  socket.emit('initialize', {
		  fileName: url,
		  size: size
	  });
	  socket.on('progress', function(data) {
		$scope.step = data.current;
		$scope.stepMax = data.maximum;
		$scope.$apply();
	  });
	  socket.on('result', function(data) {
		console.log(data);
		$scope.object = new THREE.Object3D();
		var material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });	
		var cube = new THREE.BoxGeometry(1, 1, 1);
		for(var y=0; y<size; y++)
			for(var z=0; z<size; z++)
				for(var x=0; x<size; x++)
					if(data[y][z].charAt(x) !== ' ') {
						var mesh = new THREE.Mesh(cube, material);
						mesh.position.set(x, z, y);
						$scope.object.add(mesh);
					}
		$scope.object.scale.set(1/size, 1/size, 1/size);
		$scope.$apply();
	  });
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
        camera.position.set(2, 2, 2)
        camera.lookAt(new THREE.Vector3())
    
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
            camera.lookAt(new THREE.Vector3(
              (bbox.min.x + bbox.max.x)/2,
              (bbox.min.y + bbox.max.y)/2,
              (bbox.min.z + bbox.max.z)/2
            ));
          }
        });
      },
      replace: true,
      template: '<div class="viewer"/>'
    };
  })
  ;