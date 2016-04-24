angular.module('beads3d').directive('threejsArcBallControls', function($timeout) {
  return {
    restrict: 'E',
    scope: {
      rotation: '=?',
      radius: '=?',
      onCameraChange: '&'
    },
    require: '^threejsControl',
    controller: function($scope) {
      if($scope.rotation === undefined) 
        $scope.rotation = new THREE.Euler(0, 0, 0, 'XYZ');
      if($scope.radius === undefined) 
        $scope.radius = 1;
    },
    link: function($scope, element, attr, parentCtrl) {
      var ZOOM_MAX = 20;
      var ZOOM_MIN = 1.5;
      
      var scene = new THREE.Scene();
      var wrapper = new THREE.Object3D();
      scene.add(wrapper);
      
      function createSphere(radius, color) {
        var geometry = new THREE.SphereGeometry(radius, 20, 20);
        var material = new THREE.MeshBasicMaterial({
          color: color, 
          transparent: true, 
          opacity: 0.2,
          depthWrite: false
        });
        var result = new THREE.Mesh(geometry, material);
        wrapper.add(result);
        return result;
      }
    
      var outer = null;
      var inner = null;
      
      function update() {
        if(outer != null) wrapper.remove(outer);
        if(inner != null) wrapper.remove(inner);
        outer = createSphere($scope.radius * 1.2, 0xbbbbbb);
        inner = createSphere($scope.radius, 0xaaaaaa);
      }
      
      $scope.$watch('radius', update);
      
      var up = new THREE.Vector3(0, 1, 0);
      var right = new THREE.Vector3(1, 0, 0);
      var raycaster = new THREE.Raycaster();
      var pressed = false;
      var States = {
        IDLE: -1,
        CAMERA: 0,
        ARCBALL: 1,
        PAN: 2,
        PINCH: 3
      };
      var state = States.IDLE;
      var startConfig;
      function notifyCameraChange() {
        $scope.onCameraChange({ $camera: parentCtrl.getCamera() });
      }
      function isTouchEvent(event) {
        return /touch/i.test(event.type);
      }
      function getMousePosition(event, index) {
        var x, y;
        if(isTouchEvent(event)) {
          if(index === undefined) index = 0;
          x = event.touches[index].clientX;
          y = event.touches[index].clientY;
        } else {
          x = event.clientX;
          y = event.clientY;
        }
        return new THREE.Vector2(
            x - parentCtrl.getLeft(),
            y - parentCtrl.getTop()
          );
      }
      function worldToScreen(point) { //point: Vector3
        //from: http://stackoverflow.com/questions/27409074/three-js-converting-3d-position-to-2d-screen-position-r69
        var camera = parentCtrl.getCamera();
        var widthHalf = 0.5 * parentCtrl.getWidth();
        var heightHalf = 0.5 * parentCtrl.getHeight();
        var vector = point.clone();
        vector.project(camera);
        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = -(vector.y * heightHalf) + heightHalf;
        return new THREE.Vector2(vector.x, vector.y);
      }
      function screenToWorld(point, z) {
        //from: http://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
        var camera = parentCtrl.getCamera();
        var vector = new THREE.Vector3(
          (point.x/parentCtrl.getWidth()) * 2 - 1,
          -(point.y/parentCtrl.getHeight()) * 2 + 1,
          0.5 
        );
        vector.unproject(camera);
        var dir = vector.sub(camera.position).normalize();
        var distance = (z - camera.position.z) / dir.z;
        return camera.position.clone().add(dir.multiplyScalar(distance));
      }
      function screenToWorldEx(point, refPoint) {
        //point is the mouse pointer
        //refPoint is a reference point in world space
        //returns a worldPoint parallel to the front frustum plane on the same depth as the reference point
        
        //prepare
        var camera = parentCtrl.getCamera();
        var vector = new THREE.Vector3(
          (point.x/parentCtrl.getWidth()) * 2 - 1,
          -(point.y/parentCtrl.getHeight()) * 2 + 1,
          0.5 
        );
        vector.unproject(camera);
        var clickDir = vector.sub(camera.position).normalize();
        var cameraDir = new THREE.Vector3(0, 0, -1);
        cameraDir.applyQuaternion(camera.quaternion);
        //compute
        var planeConstant = cameraDir.dot(refPoint);
        var distance = (planeConstant-cameraDir.dot(camera.position)) / (cameraDir.dot(clickDir));
        return camera.position.clone().add(clickDir.multiplyScalar(distance));
      }
      function getIntersections(event) {
        var mouse = getMousePosition(event);
        mouse.x = ( mouse.x / parentCtrl.getWidth() ) * 2 - 1;
        mouse.y = - ( mouse.y / parentCtrl.getHeight() ) * 2 + 1;	
        raycaster.setFromCamera(mouse, parentCtrl.getCamera());	
        return raycaster.intersectObjects([inner, outer]);
      }
      function touchStart(event) {
        pressed = true;
        var intersection;
        var intersections = getIntersections(event);
        var inners = intersections.filter(function(x) { return x.object === inner; });
        var outers = intersections.filter(function(x) { return x.object === outer; });
        var mouse = getMousePosition(event);
        var camera = parentCtrl.getCamera();
        if(isTouchEvent(event) && event.touches.length >= 2) {
          state = States.PINCH;
          var secondMouse = getMousePosition(event, 1);
          startConfig = {
            position: camera.position.clone(),
            pinchLength: Math.max(1, mouse.distanceTo(secondMouse)),
            mouse: mouse
          };
        } else if(inners.length > 0) {
          state = States.ARCBALL;
          intersection = inners[0];
          startConfig = {
            rotation: $scope.rotation.clone(),
            center: intersection.object.position,
            vector: intersection.point.clone().sub(intersection.object.position),
            mouse: mouse
          };
        } else if(outers.length > 0) {
          state = States.PAN;
          intersection = outers[0];
          startConfig = {
            rotation: $scope.rotation.clone(),
            center: intersection.object.position.clone(),
            vector: intersection.point.clone().sub(intersection.object.position),
            mouse: mouse
          };
        } else {
          state = States.CAMERA;
          startConfig = {
            center: new THREE.Vector3(),
            vector: camera.position.clone(),
            distance: camera.position.length(),
            mouse: mouse
          };
        }
      }
      function touchMove(event) {
        if(!pressed)
          return;
        event.preventDefault();
        var intersections = getIntersections(event);
        var inners = intersections.filter(function(x) { return x.object === inner; });
        var outers = intersections.filter(function(x) { return x.object === outer; });
        var innerIntersection = null;
        var outerIntersection = null;
        if(inners.length > 0) innerIntersection = inners[0];
        if(outers.length > 0) outerIntersection = outers[0];
        var mouse = getMousePosition(event);
        var delta = new THREE.Vector2(
          mouse.x - startConfig.mouse.x,
          mouse.y - startConfig.mouse.y
        );
        var camera = parentCtrl.getCamera();
        var startVector, endVector;
        switch(state) {
          case States.PINCH:
            var secondMouse = getMousePosition(event, 1);
            var newPinchLength = Math.max(1, mouse.distanceTo(secondMouse));
            var oldDistance = startConfig.position.length();
            var scale = startConfig.pinchLength / newPinchLength;
            scale = Math.min(ZOOM_MAX/oldDistance, Math.max(ZOOM_MIN/oldDistance, scale));
            camera.position.copy(startConfig.position.clone().multiplyScalar(scale));
            notifyCameraChange();
            break;
          case States.CAMERA:
            //old angles
            var v = startConfig.vector;
            var w = v.clone().sub(up.clone().multiplyScalar(v.dot(up)));
            var alpha = v.angleTo(up);
            var beta = w.angleTo(right);
            //compute new angles
            var ALPHA_LIMIT = Math.PI / 180 * 2;
            var alphaNew = alpha - delta.y / parentCtrl.getHeight() * Math.PI;
            alphaNew = Math.min(Math.PI - ALPHA_LIMIT, Math.max(ALPHA_LIMIT, alphaNew));
            var betaNew = beta + delta.x / parentCtrl.getWidth() * Math.PI;
            var distance = startConfig.distance;
            //apply changes
            var cosAlpha = Math.cos(alphaNew);
            var sinAlpha = Math.sin(alphaNew);
            var cosBeta = Math.cos(betaNew);
            var sinBeta = Math.sin(betaNew);
            camera.position.set(
              distance * sinAlpha * cosBeta,
              distance * cosAlpha,
              distance * sinAlpha * sinBeta
            );
            camera.lookAt(startConfig.center);
            notifyCameraChange();
            break;
          case States.ARCBALL:
            if(innerIntersection) {
              endVector = innerIntersection.point.clone().sub(innerIntersection.object.position);
            } else {
              endVector = screenToWorldEx(mouse, inner.position);
            }
            startVector = startConfig.vector.clone();
            startVector.normalize();
            endVector.normalize();
            var quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(startVector, endVector);
            var newRotation = new THREE.Quaternion().setFromEuler(startConfig.rotation);
            quaternion.multiply(newRotation);
            $scope.rotation = new THREE.Euler().setFromQuaternion(quaternion);
            $scope.$apply();
            break;
          case States.PAN:
            startVector = screenToWorldEx(startConfig.mouse, inner.position);
            endVector = screenToWorldEx(mouse, inner.position);
            startVector.normalize();
            endVector.normalize();
            var quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(startVector, endVector);
            var newRotation = new THREE.Quaternion().setFromEuler(startConfig.rotation);
            quaternion.multiply(newRotation);
            $scope.rotation = new THREE.Euler().setFromQuaternion(quaternion);
            $scope.$apply();
            break;
        }
      }
      function touchEnd(event) {
        pressed = false;
        state = States.IDLE;
      }
      function mouseWheel(event) {
        if(pressed)
          return;
        var DELTA_TO_PIXEL_MULIPLIER = [1, 15, 15 * 30];
        var delta = event.deltaY * DELTA_TO_PIXEL_MULIPLIER[event.deltaMode];
        var camera = parentCtrl.getCamera();
        var distance = camera.position.length();
        var newDistance = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, distance + delta / 1000));
        var zoom = newDistance / distance;
        camera.position.multiplyScalar(zoom);
        notifyCameraChange();
      }
      
      parentCtrl.addLayer(scene);
      
      //events
      var events = {
        touchstart: touchStart,
        mousedown: touchStart,
        touchmove: touchMove,
        mousemove: touchMove,
        touchend: touchEnd,
        mouseup: touchEnd,
        wheel: mouseWheel
      };
      for(var name in events)
        parentCtrl.on(name, events[name]);
      $scope.$on('$destroy', function() { 
        for(var name in events)
          parentCtrl.off(name, events[name]);
      });
      
      $timeout(notifyCameraChange, 100);
    },
    replace: true,
    template: '<span/>'
  };
});