module.exports = function(app) {
  app.service('Upload', function($http) {
    this.get = function(name, path) {
      return $http.get('/uploads/'+encodeURI(name)+'/'+encodeURI(path));
    };
    this.enumerate = function() {
      return $http.get('/uploads');
    };
    this.remove = function(name) {
      return $http['delete']('/uploads/'+encodeURI(name));
    };
  });
};