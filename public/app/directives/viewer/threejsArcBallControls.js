angular.module('beads3d').directive('threejsArcBallControls', function() {
  return {
    restrict: 'E',
    scope: {
      rotation: '=?'
    },
    require: '^threejsControl',
    controller: function($scope) {
      if($scope.rotation === undefined) 
        $scope.rotation = new THREE.Euler(0, 0, 0, 'XYZ');
    },
    link: function($scope, element, attr, parentCtrl) {
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
    
      var outer = createSphere(1.2, 0xff0000);
      var inner = createSphere(1, 0x00ff00);
      
      var raycaster = new THREE.Raycaster();
      var pressed = false;
      var States = {
        CAMERA: 0,
        ARCBALL: 1,
        PAN: 2
      };
      var state = States.CAMERA;
      var startConfig;
      function getIntersections(x, y) {
        var mouse = new THREE.Vector2();
        mouse.x = ( x / parentCtrl.getWidth() ) * 2 - 1;
        mouse.y = - ( y / parentCtrl.getHeight() ) * 2 + 1;	
        raycaster.setFromCamera(mouse, parentCtrl.getCamera());	
        return raycaster.intersectObjects([inner, outer]);
      }
      function touchStart(event) {
        pressed = true;
        var intersection;
        var intersections = getIntersections(event.clientX, event.clientY);
        var inners = intersections.filter(function(x) { return x.object === inner; });
        var outers = intersections.filter(function(x) { return x.object === outer; });
        var mouse = new THREE.Vector2(event.clientX, event.clientY);
        if(inners.length > 0) {
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
          var camera = parentCtrl.getCamera();
          startConfig = {
            center: new THREE.Vector3(),
            position: camera.position.clone(),
            distance: camera.position.length(),
            mouse: mouse
          };
        }
      }
      function touchMove(event) {
        if(!pressed)
          return;
        /*function toScreenPosition(vector) { //vector: THREE.Vector3
          var widthHalf = 0.5 * parentCtrl.getWidth();
          var heightHalf = 0.5 * parentCtrl.getHeight();
          vector.project(parentCtrl.getCamera());
          vector.x = ( vector.x * widthHalf ) + widthHalf;
          vector.y = - ( vector.y * heightHalf ) + heightHalf;
          return new THREE.Vector2(vector.x, vector.y);
        }*/
        var intersections = getIntersections(event.clientX, event.clientY);
        var inners = intersections.filter(function(x) { return x.object === inner; });
        var outers = intersections.filter(function(x) { return x.object === outer; });
        var innerIntersection = null;
        var outerIntersection = null;
        if(inners.length > 0) innerIntersection = inners[0];
        if(outers.length > 0) outerIntersection = outers[0];
        var delta = new THREE.Vector2(
          event.clientX - startConfig.mouse.x,
          event.clientY - startConfig.mouse.y
        );
        var camera = parentCtrl.getCamera();
        var startVector, endVector;
        switch(state) {
          case States.CAMERA:
            break;
          case States.ARCBALL:
            if(innerIntersection) {
              endVector = innerIntersection.point.clone().sub(innerIntersection.object.position);
            } else {
              var pLocal = new THREE.Vector3(delta.x, delta.y, 0).normalize();
              pLocal.applyMatrix4(camera.matrixWorld);
              endVector = pLocal;
            }
            startVector = startConfig.vector;
            startVector.normalize();
            endVector.normalize();
            var quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(endVector, startVector);
            var newRotation = new THREE.Quaternion().setFromEuler(startConfig.rotation);
            newRotation.multiply(quaternion);
            $scope.rotation = new THREE.Euler().setFromQuaternion(newRotation);
            $scope.$apply();
            break;
          case States.PAN:
            break;
        }
      }
      function touchEnd(event) {
        pressed = false;
      }
      
      //events
      parentCtrl.addLayer(scene);
      parentCtrl.on('touchstart', touchStart);
      parentCtrl.on('mousedown', touchStart);
      parentCtrl.on('touchmove', touchMove);
      parentCtrl.on('mousemove', touchMove);
      parentCtrl.on('touchend', touchEnd);
      parentCtrl.on('mouseup', touchEnd);
      $scope.$on('$destroy', function() { 
        parentCtrl.removeLayer(scene);
        parentCtrl.off('touchstart', touchStart);
        parentCtrl.off('mousedown', touchStart);
        parentCtrl.off('touchmove', touchMove);
        parentCtrl.off('mousemove', touchMove);
        parentCtrl.off('touchend', touchEnd);
        parentCtrl.off('mouseup', touchEnd);
      });
    },
    replace: true,
    transclude: true,
    template: '<span ng-transclude/>'
  };
});