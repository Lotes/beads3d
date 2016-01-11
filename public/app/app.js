var socket;

angular.module('beads3d', ['ui.bootstrap-slider', 'ngRoute', 'mgo-angular-wizard'])
  .config(function($routeProvider, $locationProvider) {
    socket = io.connect();
    $routeProvider
      .when('/', {
        templateUrl: 'views/frontpage.html'
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'SearchController'
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
      .when('/impress', {
        templateUrl: 'views/impress.html'
      })
      .when('/import', {
        templateUrl: 'views/import.html',
        controller: 'ImportController'
      })
      .when('/beadify/:model', {
        templateUrl: 'views/beadify.html',
        controller: 'BeadifyController'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .service('Model', function($http) {
    this.data = function(name) {
      return $http.get('/uploads/'+name);
    };
    this.all = function() {
      return $http.get('/uploads');
    };
    this.remove = function(name) {
      return $http.delete('/uploads/'+name);
    };
    this.beadify = function(name, size) {
      socket.emit('initialize', {
        name: name,
        size: size
      });
    };
  })
  .service('Loader', function($q) {
    this.upload = function(url, file) {
      var deferred = $q.defer();
      var form = new FormData();
      var xhr = new XMLHttpRequest;
      form.append('file', file);
      xhr.upload.onprogress = function(e) {
        deferred.notify(Math.round(e.loaded/e.total*100));
      };
      xhr.onload = function() {
        if(xhr.status === 200)
          deferred.resolve();
        else 
          deferred.reject(new Error(xhr.responseText));
      };
      xhr.open('POST', url);
      xhr.send(form);
      return deferred.promise;
    };
    this.loadOBJ = function(url) {
      var deferred = $q.defer();
      new THREE.OBJLoader().load(url, function(obj) {
        deferred.resolve(obj.children[0]);
      }, function(progress) {
        //nothing
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    };
  })
  .controller('MainController', function($scope, $location) {
    $scope.searchParameters = {};
    $scope.searchParameters.pattern = '';
    $scope.search = function() {
      $location.path('/search/'+encodeURIComponent($scope.searchParameters.pattern));
    };
  })
  .controller('ImportController', function($scope, Model, $window, Loader, $location) {
    var uploadButton = $('#uploadButton');
    $scope.uploadFile = null;
    $scope.uploading = false;
    $scope.uploadProgress = 0;
    $scope.upload = function() {
      uploadButton.click();
    };
    $scope.$watch('uploadFile', function() {
      if($scope.uploadFile === null)
        return;
      Loader
      .upload('/uploads', $scope.uploadFile)
      .then(function() {
        $scope.uploading = false;
        $scope.refresh();
      }, function(e) {
        $scope.uploading = false;
        alert(e.message);
      }, function(progress) {
        $scope.uploadProgress = progress;
      });
      $scope.uploading = true;
      $scope.uploadFile = null;
      uploadButton.parent('form').trigger('reset');
    });
    
    $scope.selection = {};
    $scope.selection.model = null;
    $scope.selection.model3D = new THREE.Object3D();
    $scope.$watch('selection.model', function() {
      $scope.selection.model3D = new THREE.Object3D();
      if($scope.selection.model === null)
        return;
      Loader.loadOBJ('/uploads/'+$scope.selection.model)
        .then(function(obj) {
          $scope.selection.model3D = new THREE.Object3D();
          $scope.selection.model3D.add(obj);
          var bbox = new THREE.Box3().setFromObject(obj);
          var size = bbox.size();
          var scale = 1/Math.max(size.x, size.y, size.z);
          $scope.selection.model3D.scale.set(scale, scale, scale);
        });
    });
    
    $scope.models = [];
    $scope.refresh = function() {
      Model.all().then(function(res) {
        $scope.models = res.data;
        if($scope.models.length > 0)
          $scope.selection.model = $scope.models[0].name;
      });
    };
    $scope.next = function() {
      $location.path('/beadify/'+$scope.selection.model);
    };
    $scope.back = function() {
      $location.path('/new');
    };
    
    $scope.download = function(name) {
      $window.open('/uploads/'+name);
    };
    
    var toRemove;
    $scope.tryRemoveModel = function(name) {
      toRemove = name;
      $('#removeDialog').modal('show');
    };
    $scope.removeModel = function() {
      $('#removeDialog').modal('hide');
      $scope.selection.model = null;
      Model.remove(toRemove).then(function() {
        $scope.refresh();
      });
    };
    
    $scope.refresh();
  })
  .controller('BeadifyController', function($scope, $location, $routeParams, Loader) {
    $scope.scene = {};
    $scope.scene.model3D = new THREE.Object3D();
    $scope.scene.cube = new THREE.Object3D();
    $scope.scene.composition = new THREE.Object3D();
    function updateScene() {
      var euler = new THREE.Euler(
        $scope.rotationModel.X / 180 * Math.PI,
        $scope.rotationModel.Y / 180 * Math.PI,
        $scope.rotationModel.Z / 180 * Math.PI,
        'YXZ'
      );
      var model = new THREE.Object3D();
      model.rotation.set(euler.x, euler.y, euler.z, euler.order);
      model.__dirtyRotation = true;
      model.add($scope.scene.model3D);
      var axisHelper = new THREE.AxisHelper(0.5);
      model.add(axisHelper);
      
      var bbox = new THREE.Box3().setFromObject(model);
      var size = bbox.size();
      var box = new THREE.Object3D();
      box.position.set(bbox.min.x, bbox.min.y, bbox.min.z);
      box.scale.set(size.x, size.y, size.z);
      box.add($scope.scene.cube);
      var axisHelper = new THREE.AxisHelper(1);
      box.add(axisHelper);
      
      $scope.scene.composition = new THREE.Object3D();
      $scope.scene.composition.add(model);
      $scope.scene.composition.add(box);
    }
    Loader.loadOBJ('/uploads/'+$routeParams.model)
      .then(function(obj) {
        $scope.scene.model3D = new THREE.Object3D();
        $scope.scene.model3D.add(obj);
        var bbox = new THREE.Box3().setFromObject(obj);
        var size = bbox.size();
        var scale = 1/Math.max(size.x, size.y, size.z);
        $scope.scene.model3D.scale.set(scale, scale, scale);
        updateScene();
      });
    Loader.loadOBJ('/app/invertedCube.obj')
      .then(function(obj) {
        var container = new THREE.Object3D();
        var geometry = obj.geometry;
        var material = new THREE.MeshLambertMaterial({
          color: 0x0000ff,
          transparent: true,
          opacity: 0.1
        });
        var mesh = new THREE.Mesh(geometry, material);
        container.add(mesh);
        container.position.set(0.5, 0.5, 0.5);
        $scope.scene.cube = new THREE.Object3D();
        $scope.scene.cube.add(container);
        updateScene();
      });
    
    $scope.selection = {};    
    $scope.selection.axis = null;
    $scope.rotationModel = { X: 0, Y: 0, Z: 0 };
    $scope.$watch('rotationModel.X', updateScene);
    $scope.$watch('rotationModel.Y', updateScene);
    $scope.$watch('rotationModel.Z', updateScene);
    
    $scope.back = function() {
      $location.path('/import');
    };
    $scope.next = function() {
      $location.path('/edit');
    };
  })
  .controller('SearchController', function($scope, $routeParams, $location) {
    $scope.pattern = $routeParams.pattern ? decodeURIComponent($routeParams.pattern) : '';
    $scope.results = [];
    //TODO
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
  .filter('bytes', function() {
    return function (num) {
      if (typeof num !== 'number') {
        throw new TypeError('Expected a number');
      }

      var exponent;
      var unit;
      var neg = num < 0;
      var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

      if (neg) {
        num = -num;
      }

      if (num < 1) {
        return (neg ? '-' : '') + num + ' B';
      }

      exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
      num = Number((num / Math.pow(1000, exponent)).toFixed(2));
      unit = units[exponent];

      return (neg ? '-' : '') + num + ' ' + unit;
    };
  })
  .directive('viewer', function() {
    return {
      restrict: 'E',
      scope: {
        'object': '=',
        'rotation': '=',
        'mode': '='
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
        camera.position.set(2, 2, 2);
        camera.lookAt(new THREE.Vector3());
    
        // scene
        scene = new THREE.Scene();
        
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        directionalLight.position.set(2, 0.5, 0);
        scene.add(directionalLight);
		
        //renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(div.devicePixelRatio);
        renderer.setClearColor(0xffffff, 1);
        onWindowResize();
        div.appendChild(renderer.domElement);

        //controls
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.enableDamping = false;
        controls.enableZoom = true;
        controls.enablePan = false;

        //rotation handling
        scope.$watch('mode', function() {
          controls.enabled = scope.mode === null;
        });
        var startRotation, startMouseX, pressing = false;
        function onMouseDown(event) {
          if(scope.mode === null)
            return;
          event.preventDefault(); 
          startRotation = scope.rotation[scope.mode];
          pressing = true;
          startMouseX = event.clientX;
        }
        function onMouseUp(event) {
          pressing = false;
          event.preventDefault(); 
        }
        function onMouseMove(event) {
          if(!pressing)
            return;
          event.preventDefault(); 
          var delta = event.clientX - startMouseX;
          var size = renderer.domElement.clientWidth;
          var deltaAngle = Math.floor(delta / size * 180);
          var angle = startRotation + deltaAngle;
          scope.rotation[scope.mode] = angle % 360;
          scope.$apply();
        }
        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
				renderer.domElement.addEventListener('mouseup', onMouseUp, false);
				renderer.domElement.addEventListener('mousedown', onMouseDown, false);
        
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
  .directive('fileModel', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
  })
  ;