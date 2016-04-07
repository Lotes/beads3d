var Q = require('q');
var database = require('../database/index');
var User = database.User;

//clears all users
function clear() {
  var deferred = Q.defer();
  User.remove({}, function(err) {
    if(err) deferred.reject(err);
    else deferred.resolve();
  });
  return deferred.promise; 
}

//create or updates a user
function put(id, name, photoUrl) {
  var deferred = Q.defer();
  User.update({ id: id }, { 
    name: name, 
    photoUrl: photoUrl 
  }, { 
    upsert: true, 
    setDefaultsOnInsert: true,
    'new': true
  }, function(err) {
    if(err) 
      deferred.reject(err);
    else
      User.findOne({ id: id }, function(err, user) {
        if(err) 
          deferred.reject(err);
        else
          deferred.resolve(user);
      });
  });
  return deferred.promise; 
}

//gets a user by id
function get(id) {
  var deferred = Q.defer();
  User.findOne({ id: id }, function(err, user) {
    if(err) 
      deferred.reject(err);
    else
      deferred.resolve(user);
  });
  return deferred.promise; 
}

module.exports = {
  clear: clear,
  put: put,
  get: get
};