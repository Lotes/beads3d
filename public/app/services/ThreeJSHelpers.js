angular.module('beads3d').service('ThreeJSHelpers', function($q) {
  this.getBoundingSphereFromObject = function(object) {
    var points = [];
    var v1 = new THREE.Vector3();
    object.updateMatrixWorld(true);
    object.traverse(function(node) {
      var geometry = node.geometry;
      if (geometry !== undefined) {
        if ( geometry instanceof THREE.Geometry ) {
          var vertices = geometry.vertices;
          for ( var i = 0, il = vertices.length; i < il; i ++ ) {
            v1.copy( vertices[ i ] );
            v1.applyMatrix4( node.matrixWorld );
            points.push(v1.clone());
          }
        } else if (geometry instanceof THREE.BufferGeometry && geometry.attributes['position'] !== undefined) {
          var positions = geometry.attributes[ 'position' ].array;
          for ( var i = 0, il = positions.length; i < il; i += 3 ) {
            v1.fromArray( positions, i );
            v1.applyMatrix4( node.matrixWorld );
            points.push(v1.clone());
          }
        }
      }
    });
    var center = points[0].clone();
    var max = 0;
    points.forEach(function(from) {
      points.forEach(function(to) {
        var d = from.distanceTo(to);
        if(d > max) {
          max = d;
          center = from.clone().add(to).multiplyScalar(0.5);
        }
      });
    });
    return new THREE.Sphere(center, max / 2);
  };
});