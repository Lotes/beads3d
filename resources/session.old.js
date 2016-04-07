var Q = require('q');
var database = require('../database/index');
var Session = database.Session;
var randomString = require('./randomString');

var SESSION_ID_LENGTH = 50;
var MAX_AGE_IN_DAYS = 366;

module.exports = {
  MAX_AGE_IN_DAYS: MAX_AGE_IN_DAYS,
  /**
   * Creates a new session and returns the session object.
   * @param sessionId {String} optional session id string
   */
  create: function createNew(sessionId) {
    var deferred = Q.defer();
    sessionId = sessionId || randomString(SESSION_ID_LENGTH);
    var session = new Session({
      cookie: sessionId
    });
    session.save(function(err) {
      if(err) 
        createNew().then(function(id) { deferred.resolve(id); }, 
          function(reason) { deferred.reject(reason); });
      else
        deferred.resolve(session);
    });
    return deferred.promise;
  },
  /**
   * Returns the session object for the given session 
   * id or null, if it does not exist.
   */
  get: function(sessionId) {
    var deferred = Q.defer();
    Session.find({ cookie: sessionId }).exec(function(err, sessions) {
      if(err) deferred.reject(err);
      else if(sessions.length === 0) deferred.resolve(null);
      else deferred.resolve(sessions[0]);
    });
    return deferred.promise;
  },
  /**
   * Updates a session with the given id or does nothing if no session was found.
   */
  access: function(sessionId) {
    var deferred = Q.defer();
    Session.update({
      cookie: sessionId, 
      lastAccessAt: { $gt: Date.now()-MAX_AGE_IN_DAYS } 
    }, { 
      lastAccessAt: Date.now() 
    }).exec(function(err) {
      deferred.resolve();
    });
    return deferred.promise;
  },
  /**
   * Clears the database from all sessions.
   */
  clear: function() {
    var deferred = Q.defer();
    Session.remove({}, function(err) {
      if(err) deferred.reject(err);
      else deferred.resolve();
    });
    return deferred.promise;
  }
};