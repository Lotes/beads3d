var socket;

angular.module('beads3d', ['ui.bootstrap-slider', 'ngRoute', 'infinite-scroll'])
  .config(function($routeProvider, $locationProvider) {
    socket = io.connect();
    $routeProvider
      .when('/', {
        templateUrl: 'views/frontpage.html',
        controller: 'FrontPageController'
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
        controller: function($scope, Model, $window, Uploader) {
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
            Uploader
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
          $scope.models = [];
          $scope.refresh = function() {
            Model.all().then(function(res) {
              $scope.models = res.data;
              if($scope.models.length > 0)
                $scope.selection.model = $scope.models[0].name;
            });
          };
          $scope.next = function() {
            alert($scope.selection.model);
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
        }
      })
      .otherwise({
        redirectTo: '/'
      })
      ;
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
  .service('Uploader', function($q) {
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
  })
  .controller('FrontPageController', function($scope, $location) {
    $scope.pattern = '';
    $scope.search = function() {
      $location.path('/search/'+encodeURIComponent($scope.pattern));
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