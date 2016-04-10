angular.module('beads3d').service('Auth', function($http) {
  var user = USER;
  this.getUser = function() { return user; };
  this.setUser = function(obj) { user = obj; };
});