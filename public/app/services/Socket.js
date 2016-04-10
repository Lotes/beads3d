angular.module('beads3d').provider('Socket', function() {
  var socket = io.connect();
  this.$get = function() {
    return socket;
  };
});