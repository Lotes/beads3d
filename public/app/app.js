var socket;

angular.module('beads3d', ['ui.bootstrap-slider', 'ngRoute', 'mgo-angular-wizard', 'ui.tree'])
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
  .service('Upload', function($http) {
    this.get = function(name, path) {
      return $http.get('/uploads/'+encodeURI(name)+'/'+encodeURI(path));
    };
    this.enumerate = function() {
      return $http.get('/uploads');
    };
    this.remove = function(name) {
      return $http.delete('/uploads/'+encodeURI(name));
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
        deferred.resolve(obj);
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
  .controller('ImportController', function($scope, Upload, $window, Loader, $location) {
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
    
    $scope.toggleNode = function(node) {
      node.expanded = !node.expanded;
    };
    $scope.uploads = {};
    function addFile(file) {
      var parts = file.path.split(/[\/\\]/);
      console.log(parts);
      var uploadName = parts[0];
      if(!(uploadName in $scope.uploads))
        $scope.uploads[uploadName] = {
          type: 'upload',
          expanded: true,
          name: uploadName,
          children: {}
        };
      var node = $scope.uploads[uploadName];
      for(var index=1; index<parts.length; index++) {
        var part = parts[index];
        if(!(part in node.children))
          if(index < parts.length - 1)
            node.children[part] = {
              type: 'directory',
              expanded: false,
              name: part,
              children: {}
            };
          else
            node.children[part] = {
              type: 'file',
              name: part,
              children: {},
              size: file.size
            };
        node = node.children[part];
      }
    }
    $scope.refresh = function() {
      Upload.enumerate().then(function(res) {
        $scope.uploads = {};
        res.data.forEach(addFile);
        console.log($scope.uploads);
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
      Upload.remove(toRemove).then(function() {
        $scope.refresh();
      });
    };
    
    $scope.refresh();
  })
  .controller('BeadifyController', function($scope, $location, $routeParams, Loader, Upload) {    
    var modelName = $routeParams.model;
    var loader = {
      model: new THREE.Object3D(),
      cube: new THREE.Object3D()
    };
    Loader.loadOBJ('/uploads/'+modelName)
      .then(function(obj) {
        loader.model = new THREE.Object3D();
        loader.model.add(obj);
        var bbox = new THREE.Box3().setFromObject(obj);
        var size = bbox.size();
        var scale = 1/Math.max(size.x, size.y, size.z);
        loader.model.scale.set(scale, scale, scale);
        updateTransformerScene();
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
        loader.cube = new THREE.Object3D();
        loader.cube.add(container);
        updateTransformerScene();
      });
    
    //=== TRANSFORMER ===
    $scope.transformer = {
      scene: new THREE.Object3D(),
      mode: null,
      rotation: {
        X: 0,
        Y: 0,
        Z: 0
      },
    };
    $scope.$watch('transformer.rotation.X', updateTransformerScene);
    $scope.$watch('transformer.rotation.Y', updateTransformerScene);
    $scope.$watch('transformer.rotation.Z', updateTransformerScene);
    function updateTransformerScene() {
      var euler = new THREE.Euler(
        $scope.transformer.rotation.X / 180 * Math.PI,
        $scope.transformer.rotation.Y / 180 * Math.PI,
        $scope.transformer.rotation.Z / 180 * Math.PI,
        'YXZ'
      );
      var model = new THREE.Object3D();
      model.rotation.set(euler.x, euler.y, euler.z, euler.order);
      model.__dirtyRotation = true;
      model.add(loader.model.clone());
      var axisHelper = new THREE.AxisHelper(0.5);
      model.add(axisHelper);
      
      var bbox = new THREE.Box3().setFromObject(model);
      var size = bbox.size();
      var box = new THREE.Object3D();
      box.position.set(bbox.min.x, bbox.min.y, bbox.min.z);
      box.scale.set(size.x, size.y, size.z);
      box.add(loader.cube.clone());
      var axisHelper = new THREE.AxisHelper(1);
      box.add(axisHelper);
      
      $scope.transformer.scene = new THREE.Object3D();
      $scope.transformer.scene.add(model);
      $scope.transformer.scene.add(box);
      
      updateSlicerScene();
    }

    //=== SLICER ===
    $scope.slicer = {
      scene: new THREE.Object3D(),
      mode: null,
      rotation: {
        X: 0,
        Y: 0,
        Z: 0
      },
      size: 5,
      maxSize: 100
    };
    $scope.$watch('slicer.rotation.X', updateSlicerScene);
    $scope.$watch('slicer.rotation.Y', updateSlicerScene);
    $scope.$watch('slicer.rotation.Z', updateSlicerScene);
    $scope.$watch('slicer.size', updateSlicerScene);
    function updateSlicerScene() {
      $scope.slicer.scene = new THREE.Object3D();
      
      var size = $scope.slicer.size;
      var opacity = Math.max(0.2 + 0.1 / size, 0.2);
      var slicer = new THREE.Object3D();
      var geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
      for(var index=0; index<=size; index++) {
        var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.FrontSide, transparent: true, opacity: opacity });
        var plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = index / size;
        slicer.add(plane);
        
        material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.BackSide, transparent: true, opacity: opacity });
        plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = index / size;
        slicer.add(plane);
      }
      var eulerSlicer = new THREE.Euler(
        $scope.slicer.rotation.X / 180 * Math.PI,
        $scope.slicer.rotation.Y / 180 * Math.PI,
        $scope.slicer.rotation.Z / 180 * Math.PI,
        'YXZ'
      );
      slicer.position.set(0.5, 0, 0.5);
      var slicerContainer = new THREE.Object3D();
      var axisHelper = new THREE.AxisHelper(1); 
      slicerContainer.add(slicer);
      slicerContainer.add(axisHelper);
      slicerContainer.rotation.set(eulerSlicer.x, eulerSlicer.y, eulerSlicer.z, eulerSlicer.order);
      slicerContainer.__dirtyRotation = true;
      
      var eulerTransform = new THREE.Euler(
        $scope.transformer.rotation.X / 180 * Math.PI,
        $scope.transformer.rotation.Y / 180 * Math.PI,
        $scope.transformer.rotation.Z / 180 * Math.PI,
        'YXZ'
      );
      var quaternionSlicer = new THREE.Quaternion().setFromEuler(eulerSlicer);
      var quaternionSlicerInverse = quaternionSlicer.clone().inverse();
      var model = new THREE.Object3D();
      model.rotation.set(eulerTransform.x, eulerTransform.y, eulerTransform.z, eulerTransform.order);
      model.__dirtyRotation = true;
      model.add(loader.model.clone());
      
      var innerModelContainer = new THREE.Object3D();
      innerModelContainer.rotation.setFromQuaternion(quaternionSlicerInverse);
      innerModelContainer.__dirtyRotation = true;
      innerModelContainer.add(model);
      
      var bbox = new THREE.Box3().setFromObject(innerModelContainer);
      innerModelContainer.position.set(-bbox.min.x, -bbox.min.y, -bbox.min.z);
      bbox = new THREE.Box3().setFromObject(innerModelContainer);
      var size = bbox.size();
      var maxSize = Math.max(size.x, size.y, size.z);
      slicerContainer.position.set(bbox.min.x, bbox.min.y, bbox.min.z);
      slicerContainer.scale.set(maxSize, maxSize, maxSize);
      
      var outerModelContainer = new THREE.Object3D();
      outerModelContainer.rotation.setFromQuaternion(quaternionSlicer);
      outerModelContainer.__dirtyRotation = true;
      outerModelContainer.add(innerModelContainer);
      
      $scope.slicer.scene.add(outerModelContainer);
      $scope.slicer.scene.add(slicerContainer);
      $scope.slicer.scene.add(new THREE.AxisHelper(1)); 
      
      updateResult();
    }
    
    //=== PARAMETERS ===
    $scope.result = {
      progress: 0,
      computing: false,
      compute: function() {
        $scope.result.computing = true;
        //TODO Model.beadify(modelName, $scope.result.size);
      },
      preTransform: null,
      postTransform: null,
      error: null,
      size: null,
      model: null,
      scene: new THREE.Object3D()
    };
    function updateResult() {
      $scope.result.size = $scope.slicer.size;
    }
    function onProgress(progress) { $scope.result.progress = progress; $scope.$apply(); }
    function onError(error) { $scope.result.error = error; $scope.$apply(); }
    function onResult(result) { 
      $scope.result.model = result;
      $scope.result.computing = false;
      updateResultScene();
      $scope.$apply();
    }
    function updateResultScene() {
      $scope.result.scene = new THREE.Object3D();
      var material = new THREE.MeshLambertMaterial({
        color: 0xffffff
      });
      var container = new THREE.Object3D();
      var model = $scope.result.model;
      for(var y=0; y<model.length; y++) {
        var layer = model[y];
        for(var z=0; z<layer.length; z++) {
          var row = layer[z];
          for(var x=0; x<row.length; x++) {
            if(row[x] === 'X') {
              var geometry = new THREE.BoxGeometry(1, 1, 1);
              var cube = new THREE.Mesh(geometry, material);
              cube.position.set(x, y, z);
              container.add(cube);     
            }
          } 
        } 
      }
      var size = model.length;
      container.scale.set(1/size, 1/size, 1/size);
      $scope.result.scene.add(container);
    }
    socket.on('progress', onProgress);
    socket.on('error', onError);
    socket.on('result', onResult);
    $scope.$on('$destroy', function() {
      socket.off('progress', onProgress);
      socket.off('error', onError);
      socket.off('result', onResult);
    });
    
    //=== EXIT NAVIGATION ===
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
          controls.enabled = scope.mode === null || typeof(scope.mode) === 'undefined';
        });
        var startRotation, startMouseX, pressing = false;
        function onMouseDown(event) {
          if(scope.mode === null || typeof(scope.rotation) === 'undefined')
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
          if(!pressing || typeof(scope.rotation) === 'undefined')
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