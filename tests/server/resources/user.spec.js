var Q = require('q');
var User = require('../../../resources/user');
var Config = require('../../../config');
var should = require('should');
var _ = require('lodash');

describe('User resource', function() {
  beforeEach(function() {
    return User.clear();
  });

  it('should create a new user', function() {
    var id = '1';
    var name = 'user';
    var url = 'http://picture.png';
    return User
      .put(id, name, url)
      .then(function() { return User.get(id); })
      .then(function(user) {
        user.id.should.be.exactly(id);
        user.name.should.be.exactly(name);
        user.photoUrl.should.be.exactly(url);
      });
  });
  
  it('should update an existing user', function() {
    var id = '1';
    var name1 = 'user';
    var url1 = 'http://picture.png';
    var name2 = 'admin';
    var url2 = 'http://picture.gif';
    return User
      .put(id, name1, url1)
      .then(function() { return User.put(id, name2, url2); })
      .then(function() { return User.get(id); })
      .then(function(user) {
        user.id.should.be.exactly(id);
        user.name.should.be.exactly(name2);
        user.photoUrl.should.be.exactly(url2);
      });
  });
});