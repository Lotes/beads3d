var Q = require('q');
var database = require('../database/index');
var Model = database.Model;
var randomString = require('./randomString');
var fs = require('fs');
var Config = require('../config');
var process = require('child_process');

//session id -> process
var beadifiers = {};

/**
 * Creates a model, returns it on success, throws error 
 * when session space was exceeded.
 * TODO ensure unique key nicely
 */
function create(buffer, session) {
  var deferred = Q.defer();
  getUsedSpace(session).then(function(space) {
    if(space + buffer.length > Config.MODELS_MAX_SPACE_PER_SESSION)
      return deferred.reject(new Error('File is too big! Maximum space is '+Config.MODELS_MAX_SPACE_PER_SESSION+' bytes.'));
    var name = randomString(Config.MODEL_NAME_LENGTH);
    var directoryPath = Config.MODELS_PATH + '/' + name;
    fs.mkdir(directoryPath, function(err) {
      if(err) deferred.reject(err);
      else {
        var modelPath = directoryPath+'/model.obj';
        fs.writeFile(modelPath, buffer, function (err) {
          if(err) deferred.reject(err);
          else {
            var model = new Model({
              name: name,
              session: session,
              size: buffer.length
            });
            model.save(function(err) {
              if(err) deferred.reject(err);
              else deferred.resolve(model);
            });
          }
        });
      }
    });
  }, function(err) { deferred.reject(err); });
  return deferred.promise;
}

function data(session, name) {  
  var deferred = Q.defer();
  query({
    session: session,
    name: name
  }).then(function(models) {
    if(models.length === 0) 
      return deferred.reject(new Error('No model "'+name+'" found!'));
    var objPath = Config.MODELS_PATH+'/'+name+'/model.obj';
    fs.readFile(objPath, 'utf8', function(err, data) {
      if(err) deferred.reject(err);
      else deferred.resolve(data);
    });
  }, function(err) { deferred.reject(err); });
  return deferred.promise;
}

function getUsedSpace(session) {
  var deferred = Q.defer();
  query({
    session: session
  }).then(function(models) {
    var sizeSum = 0;
    models.forEach(function(model) { sizeSum += model.size; });
    deferred.resolve(sizeSum);
  }, function(err) { deferred.reject(err); });
  return deferred.promise;
}

/**
 * Removes a model for the given session.
 */
function remove(session, name) {
  var deferred = Q.defer();
  Model.remove({
    session: session,
    name: name
  }, function(err) {
    if(err) deferred.reject(err);
    else deferred.resolve();
  });
  return deferred.promise;
}

/**
 * Queries the database for models with the provided parameters.
 * Returns a list of models.
 */
function query(options) {
  var deferred = Q.defer();
  Model.find(options).exec(function(err, models) {
    if(err) deferred.reject(err);
    else deferred.resolve(models);
  });
  return deferred.promise;
}

/**
 * Beadifies a model with a maximal resolution of <size>.
 * The returned promise notifies about progress.
 * Returns a voxel JSON object. Throws error on format exceptions.
 * Only one beadifier per session allowed! Existing computations will be killed.
 */
function beadify(session, name, size) {
  var deferred = Q.defer();
  query({
    session: session,
    name: name
  }).then(function(models) {
    if(models.length === 0)
      deferred.reject(new Error('No model "'+name+'" found!'));
    else {
      var resultPath = Config.MODELS_PATH+'/'+name+'/'+size+'.json';
      fs.readFile(resultPath, 'utf8', function(err, data) {
        if(!err)
          try {
            return deferred.resolve(JSON.parse(data));  
          } catch(ex) {}
        //no result file found, compute one
        if(session.cookie in beadifiers) {
          //kill existing process
          var beadifier = beadifiers[session.cookie];
          beadifier.kill();
          delete beadifiers[session.cookie];
        }
        //start new process
        var objPath = Config.MODELS_PATH+'/'+name+'/model.obj';
        var command = Config.BEADIFIER_EXECUTABLE_PATH+' "'+objPath+'" '+size+' "'+resultPath+'"';            
        var beadify = process.exec(command, {cwd: Config.BEADIFIER_PATH });
        beadifiers[session.cookie] = beadify;
        //parse std output
        var text = '';
        var pattern = /(\d+)\/(\d+)/;
        function parseText() {
          var match = pattern.exec(text);
          if(match != null) {
            var progress = 100 * parseInt(match[1], 10) / parseInt(match[2], 10);
            deferred.notify(progress);
            text = '';
          }
        }
        beadify.stdout.on('data', function(data) {
          var lines = data.split('\n');
          lines.forEach(function(line) {
            text += line;
            parseText();
          });
        });
        beadify.on('exit', function(code) {
          delete beadifiers[session.cookie];
          if(code === 0) {
            fs.readFile(resultPath, 'utf8', function(err, data) {
              if(!err)
                try {
                  deferred.resolve(JSON.parse(data));  
                } catch(ex) { deferred.reject(ex); }
              else
                deferred.reject(err);
            });
          } else
            deferred.reject(new Error('Beadifier exited with code '+code+'.'));
        });
      });
    }
  }, function(err) { deferred.reject(err); });    
  return deferred.promise;
}


module.exports = {
  beadify: beadify,
  query: query,
  remove: remove,
  getUsedSpace: getUsedSpace,
  data: data,
  create: create
};