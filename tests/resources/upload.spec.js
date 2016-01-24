var Q = require('q');
var path = require('path');
var Upload = require('../../resources/upload');
var Config = require('../../config');
var Session = require('../../resources/session');
var should = require('should');

describe('Upload resource', function() {
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
      .then(function(result) { done(); })
      .fail(done);
  });
  
  it('should upload same file with different name', function(done) {
    Q.all([
      Upload.uploadLocalFile(session, venusaurModelPath),
      Upload.uploadLocalFile(session, venusaurModelPath)
    ]).then(function(results) {
      try {
        results[0].should.not.equal(results[1]);
        done();
      } catch(err) { done(err); }
    })
    .fail(done);
  });
  
  it('should fail uploading non-existing file', function(done) {
    Upload.uploadLocalFile(session, 'FAIL.zip')
      .then(function(result) { done(new Error('Unexpected success!')); })
      .fail(function(err) { done(); });
  });
  
  it('should fail uploading unacceptable file format', function(done) {
    Upload.uploadLocalFile(session, './config.js')
      .then(function(result) { done(new Error('Unexpected success!')); })
      .fail(function(err) { done(); });
  });
});