Dropzone.options.myAwesomeDropzone = {
  paramName: "file",
  maxFilesize: 5, // MB
  accept: function(file, done) {
	if(file.name.toLowerCase().indexOf('.obj') != file.name.length - 4) 
		done('Only OBJ files are accepted!');
    else 
		done();
  }
};

angular.module('beads3d', ['ui.bootstrap-slider', 'ngRoute', 'infinite-scroll'])
  .config(function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/frontpage.html',
        controller: 'FrontPageController'
      })
      .when('/search/:pattern*', {
        templateUrl: 'views/search.html',
        controller: 'SearchController'
      })
      .when('/new', {
        templateUrl: 'views/new.html'
      })
      .when('/edit', {
        templateUrl: 'views/edit.html'
      })
      .when('/import', {
        templateUrl: 'views/import.html',
        controller: function($scope) {
          var uploadZone = new Dropzone('div#upload-zone', { url: '/uploads' });
          uploadZone.on('complete', function(data) {
            console.log(data);
          });
        }
      })
      .otherwise({
        redirectTo: '/'
      })
      ;
  })
  .controller('FrontPageController', function($scope, $location) {
    $scope.pattern = '';
    $scope.search = function() {
      $location.path('/search/'+encodeURIComponent($scope.pattern));
    };
  })
  .controller('SearchController', function($scope, $routeParams, $location) {
    $scope.pattern = decodeURIComponent($routeParams.pattern);
    $scope.results = [];
    for(var index=0; index<10; index++)
        $scope.results.push($scope.pattern+$scope.results.length);
    $scope.search = function() {
      $location.path('/search/'+encodeURIComponent($scope.pattern));
    };
    $scope.searchMore = function() {
      for(var index=0; index<10; index++)
        $scope.results.push($scope.pattern+$scope.results.length);
    };
  })
  /*.directive('whenScrolled', function ($document) {
      return {
          restrict: 'A',
          link: function (scope, element, attrs) {
              var raw = element[0];
              $document.bind('scroll', function () {
                  console.log(raw.scrollTop+'+'+raw.offsetHeight+'>'+raw.scrollHeight);
                  if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                      scope.$apply(attrs.whenScrolled);
                  }
              });
          }
      };
  })*/
/*  .controller('MainController', function($scope, $q, $interval) {
    var uploadZone = new Dropzone('div#upload-zone', { url: '/upload' });
      uploadZone.on('complete', function(data) {
      console.log(data);
    });
	
	var material = new THREE.MeshBasicMaterial({color: 0x000000 });
	var socket = io.connect();
  
	$scope.url = 'models/pikachu.obj';
	$scope.size = 10;
	$scope.maxSize = 40;
  
	$scope.progress = 0;
	$scope.step = 0;
	$scope.stepMax = 100;
    $scope.object = new THREE.Object3D();
	
    $scope.load = function() {
	  var url = $scope.url;
      var size = $scope.size;
	  $scope.progress = 0;
	  $scope.step = 0;
	  $scope.object = new THREE.Object3D();
	  socket.emit('initialize', {
		  fileName: url,
		  size: size
	  });
	  socket.on('progress', function(data) {
		$scope.progress = data.current / data.maximum * 100;
		$scope.step = data.current;
		$scope.stepMax = data.maximum;
		$scope.$apply();
	  });
	  socket.on('result', function(data) {
		$scope.object = new THREE.Object3D();
		var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });	
		var cube = new THREE.BoxGeometry(1, 1, 1);
		for(var y=0; y<size; y++)
			for(var z=0; z<size; z++)
				for(var x=0; x<size; x++)
					if(data[y][z].charAt(x) !== ' ') {
						var mesh = new THREE.Mesh(cube, material);
						mesh.position.set(x, y, z);
						$scope.object.add(mesh);
					}
		$scope.object.scale.set(1/size, 1/size, 1/size);
		$scope.$apply();
	  });
    };
	
	$scope.$watch('size', $scope.load);
  })*/
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
          directionalLight.position.x = camera.position.x;
          directionalLight.position.y = camera.position.y;
          directionalLight.position.z = camera.position.z;
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
        
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        directionalLight.position.set(2, 0.5, 0);
        scene.add(directionalLight);
		
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
            newValue.position.set(
              -(bbox.min.x + bbox.max.x)/2,
              -(bbox.min.y + bbox.max.y)/2,
              -(bbox.min.z + bbox.max.z)/2
            );
          }
        });
      },
      replace: true,
      template: '<div class="viewer"/>'
    };
  })
  ;