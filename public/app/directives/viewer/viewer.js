angular.module('beads3d').directive('viewer', function() {
  return {
    restrict: 'E',
    scope: {
      'object': '=',
      'rotation': '=',
      'mode': '=',
      'isLoading': '='
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

      var geometry = new THREE.SphereGeometry(1.2, 20, 20);
      var material = new THREE.MeshBasicMaterial({
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.05,
        depthWrite: false
      });
      var sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      
      var geometry2 = new THREE.SphereGeometry(1, 20, 20);
      var material2 = new THREE.MeshBasicMaterial({
        color: 0x0000ff, 
        transparent: true, 
        opacity: 0.05,
        depthWrite: false
      });
      var sphere2 = new THREE.Mesh(geometry2, material2);
      scene.add(sphere2);
      
      //renderer
      renderer = new THREE.WebGLRenderer({
        alpha: true
      });
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
        if(scope.mode === null || typeof(scope.rotation) === 'undefined') {
          return;
        }
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
        if(!pressing || typeof(scope.rotation) === 'undefined') {
          return;
        }
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
        if(oldValue) {
          scene.remove(oldValue);	
        }
        if(newValue) {
          scene.add(newValue);
          
          var bbox = new THREE.Box3().setFromObject(newValue);
          var radius = bbox.max.clone().sub(bbox.min).length() / 2;
          sphere.scale.set(radius, radius, radius);
          sphere2.scale.set(radius, radius, radius);
          newValue.position.set(
            -(bbox.min.x + bbox.max.x)/2,
            -(bbox.min.y + bbox.max.y)/2,
            -(bbox.min.z + bbox.max.z)/2
          );
        }
      });
    },
    replace: true,
    template: '<div class="viewer"><span us-spinner ng-if="isLoading"></span></div>'
  };
});