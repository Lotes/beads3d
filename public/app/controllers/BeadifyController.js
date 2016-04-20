angular.module('beads3d').controller('BeadifyController', function($scope, $location, $routeParams, Loader, Upload, Socket, $interval) {    
  $scope.pos = new THREE.Vector3();
  $scope.sca = new THREE.Vector3();
  $scope.rot = new THREE.Euler(0, 0, 0, 'XYZ');
  $scope.mmmodelpos = new THREE.Vector3(0,0,0);
  $scope.mmmodelsca = new THREE.Vector3(1,1,1);
  var R = 2;
  var alpha = 0;
  $interval(function() {
    alpha += 1 * Math.PI / 180;
    var sin = Math.sin(alpha);
    $scope.pos = new THREE.Vector3(R * Math.cos(alpha), 0, R*sin);
    $scope.sca = new THREE.Vector3(sin, sin, sin);
  }, 50);
  
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
      $scope.mmmodel = obj;
      updateTransformerScene();
      
      $scope.mmmodelpos = new THREE.Vector3(-bbox.min.x-size.x/2, -bbox.min.y-size.y/2, -bbox.min.z-size.z/2);
      $scope.mmmodelsca = new THREE.Vector3(scale, scale, scale);
    });
  Loader.loadOBJ('/utils/invertedCube.obj')
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
  Socket.on('progress', onProgress);
  Socket.on('error', onError);
  Socket.on('result', onResult);
  $scope.$on('$destroy', function() {
    Socket.off('progress', onProgress);
    Socket.off('error', onError);
    Socket.off('result', onResult);
  });
  
  //=== EXIT NAVIGATION ===
  $scope.back = function() {
    $location.path('/import');
  };
  $scope.next = function() {
    $location.path('/edit');
  };
});