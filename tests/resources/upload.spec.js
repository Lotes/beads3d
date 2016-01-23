var Q = require('q');
var path = require('path');
var Upload = require('../../resources/upload');
var Config = require('../../config');
var Session = require('../../resources/session');
var should = require('should');

describe('resources/upload', function() {
  var venusaurModelPath = path.join(Config.DEVELOPMENT_DATA_PATH, 'models', 'venusaur.zip');
  var session = null;
  
  function clear() {
    return Q.all([
      Upload.clearSessionsDirectory(),
      Upload.clearTempDirectory(),
      Session.clear()
    ]);
  }
  
  beforeEach(function() {
    return clear()
      .then(function() {
        return Session.create(Config.DEVELOPMENT_SESSION).then(function(newSession) { 
          session = newSession;
        });
      });
  });
  
  /*afterEach(function() {
    return clear();
  });*/
  
  it('should upload local file', function(done) {
    Upload.uploadLocalFile(session, venusaurModelPath)
      .then(done)
      .fail(function(err) {
        done(err);
      });
  });
});