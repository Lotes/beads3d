var Q = require('q');
var path = require('path');
var Upload = require('../../resources/upload');
var Config = require('../../config');
var Session = require('../../resources/session');
var should = require('should');
var _ = require('lodash');

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
  
  describe('with uploaded model', function() {
    var uploadFolderName = 'venusaur';
    var uploadModelName = 'Venusaur.obj';
    var objFilePath = path.join(uploadFolderName, uploadModelName);
    
    beforeEach(function() {
      return Upload.uploadLocalFile(session, venusaurModelPath);
    });

    it('should enumerate files', function(done) {
      Upload.enumerate(session)
        .then(function(files) {
          var index = _.findIndex(files, function(file) {
            return file.path === objFilePath;
          });
          done(index === -1 ? new Error('File not found!') : undefined);
        })
        .fail(done);
    });
    
    it('should download file', function(done) {
      Upload.get(session, uploadFolderName, uploadModelName)
        .then(function(data) { done(data.length > 0 ? undefined : new Error('Empty file!')); })
        .fail(done);
    });
    
    it('should fail download non-existing file', function(done) {
      Upload.get(session, uploadFolderName, 'nonsense.obj')
        .then(function(data) { done(new Error('Unexpected success!')); })
        .fail(function(err) { done(); });
    });
  })
});