var Q = require('q');
var path = require('path');
var Upload = require('../../../resources/upload');
var Config = require('../../../config');
var User = require('../../../resources/user');
var should = require('should');
var _ = require('lodash');
var fs = require('fs');
var fse = require('fs-extra');

describe('Upload resource', function() {
  var user;
  var modelPath = path.join(Config.DEVELOPMENT_DATA_PATH, 'models', 'venusaur.zip');

  beforeEach(function() {
    return Q.all([
      User.clear(),
      Upload.clear()
    ]).then(function() {
      return User.put('1', 'Test user', 'animated.gif');
    }).then(function(obj) {
      user = obj;
    });
  });
  
  it('should be entirely empty', function(done) {
    var fail = false;
    fse.walk(Config.UPLOADS_PATH)
      .on('data', function (item) {
        if(item.path !== Config.UPLOADS_PATH)
          fail = true; 
      })
      .on('end', function () { 
        done(fail ? new Error('Uploads are not empty!') : null);
      });
  });
  
  it('should upload local file', function(done) {
    Upload.uploadLocal(user, modelPath)
      .then(function(result) { 
        return Upload.enumerate(user)
          .then(function(uploads) {
            uploads.length.should.be.exactly(1);
            uploads[0].name.should.be.exactly(result.name);
            done();
          });
      })
      .fail(done);
  });
  
  it('should fail uploading non-existing file', function() {
    return Upload.uploadLocal(user, 'FAIL.zip')
      .should.be.rejected();
  });
  
  it('should fail uploading unacceptable file format', function() {
    return Upload.uploadBuffer(user, 'Format.fail', '123')
      .should.be.rejected();
  });
  
  it('should fail uploading over space limit', function() {
    this.timeout(100000);
    var promises = [];
    for(var index=0; index<5; index++)
      promises.push(Upload.uploadLocal(user, modelPath));
    return Q.all(promises).should.be.rejected();
  });
  
  it('should upload same file under different id', function() {
    this.timeout(100000);
    var promises = [
      Upload.uploadLocal(user, modelPath),
      Upload.uploadLocal(user, modelPath)
    ];
    return Q.all(promises)
      .then(function(results) {
        return results.map(function(result) { return result.id; });
      })
      .then(function(ids) {
        ids[0].should.not.be.exactly(ids[1]);
      });
  });
});