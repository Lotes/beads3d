angular.module('beads3d').service('Upload', function($http) {
  this.get = function(name, path) {
    return $http.get('/uploads/'+encodeURI(name)+'/'+encodeURI(path));
  };
  this.enumerate = function() {
    return $http.get('/uploads');
  };
  this.remove = function(id) {
    return $http['delete']('/uploads/'+id);
  };
});