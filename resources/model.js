var Q = require('q');
var database = require('../database/index');
var Model = database.Model;
var randomString = require('./randomString');
var fs = require('fs');
var Config = require('../config');

var MODEL_NAME_LENGTH = 20;

//session id -> process
var beadifiers = {};

module.exports = {
  /**
   * Creates a model, returns name on success, throws error 
   * when session space was exceeded
   */
  create: function create(buffer, session) {
    var deferred = Q.defer();
    var name = randomString(MODEL_NAME_LENGTH);
    var directoryPath = Config.MODELS_PATH + '/' + name;
    fs.mkdir(directoryPath, function(err) {
      if(err) deferred.reject(err);
      else {
        var modelPath = directoryPath+'/model.obj';
        fs.writeFile(modelPath, buffer, function (err) {
          if(err) deferred.reject(err);
          else {
            new Model({
              name: name,
              session: session,
              size: buffer.length
            }).save(function(err) {
              if(err) deferred.reject(err);
              else deferred.resolve(name);
            });
          }
        });
      }
    });
    return deferred.promise;
  },
  /**
   * Removes a model for the given session.
   */
  remove: function(session, name) {
    var deferred = Q.defer();
    Model.remove({
      session: session,
      name: name
    }, function(err) {
      if(err) deferred.reject(err);
      else deferred.resolve();
    });
    return deferred.promise;
  },
  /**
   * Queries the database for models with the provided parameters.
   * Returns a list of models.
   */
  query: function query(options) {
    var deferred = Q.defer();
    Model.find(options).exec(function(err, models) {
      if(err) deferred.reject(err);
      else deferred.resolve(models);
    });
    return deferred.promise;
  },
  /**
   * Beadifies a model with a maximal resolution of <size>.
   * The returned promise notifies about progress.
   * Returns a voxel JSON object. Throws error on format exceptions.
   * Only one beadifier per session allowed! Existing computations will be killed.
   */
  beadify: function beadify(session, name, size) {
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
          if(!(session.cookie in beadifiers)) {
            //kill existing process
            var process = beadifiers[session.cookie];
            process.kill();
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
              deferred.notify({
                current: parseInt(match[1], 10),
                maximum: parseInt(match[2], 10)
              });
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
};