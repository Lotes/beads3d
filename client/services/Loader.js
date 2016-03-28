module.exports = function(app) {
  app.service('Loader', function($q) {
    this.upload = function(url, file) {
        var deferred = $q.defer();
        var form = new FormData();
        var xhr = new XMLHttpRequest();
        form.append('file', file);
        xhr.upload.onprogress = function(e) {
          deferred.notify(Math.round(e.loaded/e.total*100));
        };
        xhr.onload = function() {
          if(xhr.status === 200) {
        	  deferred.resolve();
          } else { 
            deferred.reject(new Error(xhr.responseText));
          }
        };
        xhr.open('POST', url);
        xhr.send(form);
        return deferred.promise;
      };
      this.loadOBJ = function(url) {
        var deferred = $q.defer();
        new THREE.OBJMTLLoader().loadByOBJ(url, function(obj) {
          deferred.resolve(obj);
        }, function(progress) {
          //nothing
        }, function(err) {
          deferred.reject(err);
        });
        return deferred.promise;
      };
    });
};