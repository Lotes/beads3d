angular.module('beads3d', ['ui.bootstrap-slider'])
  .controller('BeadifyController', function($scope, $http) {
    $scope.model = new THREE.Object3D();
	var files = ['A', 'B', '1.a', '2.a', '3.b', '4.b', '5.b', '6.b', '7.a', '8.a', 'result'];
    var index = 0;
	function checkKey(e) {
		e = e || window.event;
		if (e.keyCode == '37') {
		   index = (index - 1) % files.length;
		   load();
		}
		else if (e.keyCode == '39') {
		   index = (index + 1) % files.length;
		   load();
		}
	}
	function load() {
		$http({
		  method: 'GET',
		  url: '/beadifier/'+files[index]+'.json'
		}).then(function(response) {
			var triangles = response.data;
			var geometry = new THREE.Geometry();
			for(var index=0; index<triangles.length; index++) {
				var triangle = triangles[index];
				for(var vIndex=0; vIndex<3; vIndex++) {			
					var vertex = triangle[vIndex];
					geometry.vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));	
				}
				geometry.faces.push(new THREE.Face3(index*3, index*3+1, index*3+2));	
			}
			var material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
			$scope.model = new THREE.Object3D();
			$scope.model.add(new THREE.Mesh(geometry, material));
		});	
		console.log('loading '+files[index]);
	}
	load();
	document.onkeydown = checkKey;	
  })
  .controller('MainController', function($scope, $q, $interval) {
    var material = new THREE.MeshBasicMaterial({color: 0x000000 });
  
    $scope.object = null;
    $scope.voxelHeap = null;
    $scope.layers = [];
    $scope.size = 8;
    $scope.maxSize = 160;
    
    $scope.voxelSize = 1;
    $scope.computing = false;
    $scope.step = 1;
    $scope.stepMax = 0;
    $scope.workingPackages = [];
  
    $interval(function() {
      if($scope.workingPackages.length === 0)
        return;
      var index = Math.floor(Math.random()*$scope.workingPackages.length);
      var workingPackage = $scope.workingPackages[index];
      $scope.workingPackages.splice(index, 1);
      var bsp = workingPackage.bsp;
      var layers = workingPackage.layers;
      var xs = workingPackage.xs;
      var ys = workingPackage.ys;
      var layerIndex = layers[0];
      var y = ys[0];
      var x = xs[0];
      var layerLength = layers[1]-layers[0]+1;
      var xLength = xs[1]-xs[0]+1;
      var yLength = ys[1]-ys[0]+1;
      var geometry = new THREE.BoxGeometry(
        $scope.voxelSize*xLength,
        $scope.voxelSize*layerLength, 
        $scope.voxelSize*yLength
      );
      var voxel = new THREE.Mesh(geometry, material);
      voxel.position.set(
        (x          + xLength    /2)*$scope.voxelSize,
        (layerIndex + layerLength/2)*$scope.voxelSize,
        (y          + yLength    /2)*$scope.voxelSize
      );
      var voxelBSP = new ThreeBSP(voxel);
      var intersectionBSP = voxelBSP.intersect(bsp);
      var mesh = intersectionBSP.toMesh(material);
      var bbox = new THREE.Box3().setFromObject(mesh);
      var size = bbox.size().length();
      var present = isFinite(size) && size !== 0;
      
      if(layers[0] !== layers[1] || xs[0] !== xs[1] || ys[0] !== ys[1]) {
        $scope.step++;
        //split into sub work packages
        var splitLayers = layers[0] !== layers[1];
        var splitXs = xs[0] !== xs[1];
        var splitYs = ys[0] !== ys[1];
        var lmid = Math.floor((layers[0] + layers[1])/2);
        var xmid = Math.floor((xs[0] + xs[1])/2);
        var ymid = Math.floor((ys[0] + ys[1])/2);
        function addWorkingPackage(lf, lt, xf, xt, yf, yt) {
          var wp = {
            layers: [lf, lt],
            xs: [xf, xt],
            ys: [yf, yt],
            volume: (lt-lf+1)*(xt-xf+1)*(yt-yf+1),
            bsp: intersectionBSP
          };
          $scope.workingPackages.push(wp);
        }
        if(splitLayers) {
          if(splitXs) {
            if(splitYs) {
              addWorkingPackage(layers[0], lmid,      xs[0],   xmid, ys[0],  ymid);
              addWorkingPackage(layers[0], lmid,      xs[0],   xmid, ymid+1, ys[1]);
              addWorkingPackage(layers[0], lmid,      xmid+1, xs[1], ys[0],  ymid);
              addWorkingPackage(layers[0], lmid,      xmid+1, xs[1], ymid+1, ys[1]);
              addWorkingPackage(lmid+1,    layers[1], xs[0],   xmid, ys[0],  ymid);
              addWorkingPackage(lmid+1,    layers[1], xs[0],   xmid, ymid+1, ys[1]);
              addWorkingPackage(lmid+1,    layers[1], xmid+1, xs[1], ys[0],  ymid);
              addWorkingPackage(lmid+1,    layers[1], xmid+1, xs[1], ymid+1, ys[1]);
            } else {
              addWorkingPackage(layers[0],   lmid,    xs[0],   xmid, ys[0],  ys[1]);
              addWorkingPackage(layers[0],   lmid,    xmid+1, xs[1], ys[0],  ys[1]);
              addWorkingPackage(lmid+1,    layers[1], xs[0],   xmid, ys[0],  ys[1]);
              addWorkingPackage(lmid+1,    layers[1], xmid+1, xs[1], ys[0],  ys[1]);
            }    
          } else {
            if(splitYs) {
              addWorkingPackage(layers[0], lmid,      xs[0],   xs[1], ys[0],  ymid);
              addWorkingPackage(layers[0], lmid,      xs[0],   xs[1], ymid+1, ys[1]);
              addWorkingPackage(lmid+1,    layers[1], xs[0],   xs[1], ys[0],  ymid);
              addWorkingPackage(lmid+1,    layers[1], xs[0],   xs[1], ymid+1, ys[1]);
            } else {
              addWorkingPackage(layers[0], lmid,      xs[0],   xs[1], ys[0],  ys[1]);
              addWorkingPackage(lmid+1,    layers[1], xs[0],   xs[1], ys[0],  ys[1]);
            }    
          }  
        } else {
          if(splitXs) {
            if(splitYs) {
              addWorkingPackage(layers[0], layers[1], xs[0],   xmid, ys[0],  ymid);
              addWorkingPackage(layers[0], layers[1], xs[0],   xmid, ymid+1, ys[1]);
              addWorkingPackage(layers[0], layers[1], xmid+1, xs[1], ys[0],  ymid);
              addWorkingPackage(layers[0], layers[1], xmid+1, xs[1], ymid+1, ys[1]);
            } else {
              addWorkingPackage(layers[0], layers[1], xs[0],   xmid, ys[0],  ys[1]);
              addWorkingPackage(layers[0], layers[1], xmid+1, xs[1], ys[0],  ys[1]);
            }    
          } else {
            if(splitYs) {
              addWorkingPackage(layers[0], layers[1], xs[0],   xs[1], ys[0],  ymid);
              addWorkingPackage(layers[0], layers[1], xs[0],   xs[1], ymid+1, ys[1]);
            } else {
              //empty, no packages
            }    
          }  
        }
      } else {        
        if(present) {
          $scope.layers[layerIndex][y][x] = 0xffffff;      
          $scope.voxelHeap.add(mesh);
        }
        $scope.step++;
      }
    }, 10);
  
    function voxelify() {
      var model = $scope.object;
      var size = $scope.size;
      if(!model)
        return;
      $scope.workingPackages = [];
      $scope.voxelSize = 1/size;
      var modelBSP = new ThreeBSP(model);
      var result = [];
      for(var layerIndex=0; layerIndex<size; layerIndex++) {
        var rows = [];
        for(var y=0; y<size; y++) {
          var columns = [];
          for(var x=0; x<size; x++) {
            columns.push(null);
          }
          rows.push(columns);
        }
        result.push(rows);
      }
      $scope.workingPackages.push({
        layers: [0, size-1],
        xs: [0, size-1],
        ys: [0, size-1],
        volume: size*size*size,
        bsp: modelBSP
      });
      $scope.step = 0;
      $scope.stepMax = 2*size*size*size-1;
      $scope.layers = result;
      $scope.voxelHeap = new THREE.Object3D();
    }
    
    function meshify() {
      var result = new THREE.Object3D();
      var size = $scope.layers.length;
      var voxelSize = 1/size;
      for(var layerIndex=0; layerIndex<size; layerIndex++)
        for(var y=0; y<size; y++)
          for(var x=0; x<size; x++) {
            var color = $scope.layers[layerIndex][y][x];
            if(color) {
              var material = new THREE.MeshBasicMaterial({color: color});
              var geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
              var voxel = new THREE.Mesh(geometry, material);
              voxel.position.set(
                (x+0.5)*voxelSize,
                (layerIndex+0.5)*voxelSize,
                (y+0.5)*voxelSize
              );  
              result.add(voxel);
            }  
          }
      $scope.voxelHeap = result;
    }
    
    $scope.$watch('object', voxelify);
    $scope.$watch('size', voxelify);
    //$interval(meshify, 500);
  
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
          var bbox = new THREE.Box3().setFromObject(object);
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