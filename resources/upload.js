var Q = require('q');
var database = require('../database/index');
var Upload = database.Upload;
var randomString = require('./randomString');
var fs = require('fs');
var fse = require('fs-extra');
var Config = require('../config');
var process = require('child_process');
var path = require('path');
var _ = require('lodash');
var lock = require('./lock');

function clearSessionsDirectory() {
  var deferred = Q.defer();
  fse.emptyDir(Config.SESSIONS_PATH, function(err) {
    if(err) deferred.reject(err);
    else deferred.resolve();
  });
  return deferred.promise;
}

function clearTempDirectory() {
  var deferred = Q.defer();
  fse.emptyDir(Config.TEMP_PATH, function(err) {
    if(err) deferred.reject(err);
    else deferred.resolve();
  });
  return deferred.promise;
}

function clearDatabase() {
  var deferred = Q.defer();
  Upload.remove({}, function(err) {
    if(err) deferred.reject(err);
    else deferred.resolve();
  });
  return deferred.promise;
}

function unpack(sourceFileName, destinationFolder) {
  var deferred = Q.defer();
  var command = Config.UNPACKER_EXECUTABLE_PATH + '"' + sourceFileName + '" "'+destinationFolder+'"';
  var zipProcess = process.exec(command, {cwd: Config.VOXELIFY_PATH });
  //handle errors
  var errorMessage = '';
  zipProcess.stdout.on('data', function(data) {
    errorMessage += data;
  });
  //handle exit
  zipProcess.on('exit', function(code) {
    if(code === 0) return deferred.resolve();
    deferred.reject(new Error('Unpack error: '+errorMessage));
  });
  return deferred.promise;
}

var tempZipFileIndex = 0;
/**
 * Uploads a file or ZIP archive to a session.
 * If it is a ZIP file it will be unpacked. All OBJ, MTL, TGA and PNG files will be copied.
 * @throws an exception, otherwise (file not accepted)
 * @throws an exception, if session space was exceeded.
 */
function uploadBuffer(session, name, data) {
  var deferred = Q.defer();
  var lowerCaseName = _.lowerCase(name);
  var dotIndex = name.lastIndexOf('.');
  var folderName = dotIndex > -1 ? name.substr(0, dotIndex) : name;
  folderName = folderName.replace(/[ \\\/]/g, '');
  if(/\.(zip)$/.test(lowerCase)) {
    //it's a zip file!
    tempZipFileIndex++;
    var tempZipFilePath = path.join(Config.TEMP_PATH, tempZipFileIndex+'.zip');
    var folderPath = path.join(Config.SESSION_PATH, session.cookie, folderName);
    fse.outputFile(tempZipFilePath, data, function(err) {
      if(err) return deferred.resolve(err);
      function removeZip() { fse.remove(tempZipFilePath); }
      unpack(tempZipFilePath, folderPath)
        .then(
          function() { 
            removeZip();
            var sumSize = 0;
            fse.walk(folderPath)
              .on('data', function(item) { sumSize += item.stats.size; })
              .on('error', function(err3) { deferred.reject(err3); })
              .on('end', function() {
                
              });
          }, function(err2) { 
            removeZip();
            deferred.reject(err2);
          },
        );
    });
  } else {
    //it's not accepted
    deferred.reject(new Error('Unacceptable file type!'));
  }
  return deferred.promise;
}

/**
 * Same as uploadBuffer(...). A local file will be read out and passed.
 */
function uploadLocalFile(session, fileName) {
  var deferred = Q.defer();
  fse.readFile(fileName, function(err, data) {
    if(err)
      return deferred.reject(err);
    var name = path.basename(fileName);
    uploadBuffer(session, name, data)
      .then(
        function(result) { deferred.resolve(result); }, 
        function(ex) { deferred.reject(ex); }
      );
  });
  return deferred.promise;
}

module.exports = {
  clearTempDirectory: clearTempDirectory,
  clearSessionsDirectory: clearSessionsDirectory,
  clearDatabase: clearDatabase,
  
  uploadLocalFile: uploadLocalFile,
  uploadBuffer: uploadBuffer
};

//---------------------------------------------------------

/**
 * Creates a model, returns it on success, throws error 
 * when session space was exceeded.
 * TODO ensure unique key nicely
 */
function create(displayName, buffer, session) {
  var deferred = Q.defer();
  getUsedSpace(session).then(function(space) {
    if(space + buffer.length > Config.MODELS_MAX_SPACE_PER_SESSION)
      return deferred.reject(new Error('File is too big! Maximum space is '+Config.MODELS_MAX_SPACE_PER_SESSION+' bytes.'));
    var name = randomString(Config.MODEL_NAME_LENGTH);
    var directoryPath = path.join(Config.MODELS_PATH, name);
    fse.mkdirs(directoryPath, function(err) {
      if(err) deferred.reject(err);
      else {
        var zipPath = directoryPath+'.zip';
        fs.writeFile(modelPath, buffer, function (err) {
          if(err) deferred.reject(err);
          else {
            /*var upload = new Model({
              name: name,
              displayName: displayName,
              session: session,
              size: buffer.length
            });
            upload.save(function(err) {
              if(err) deferred.reject(err);
              else deferred.resolve(upload);
            });*/
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
  Model.findOne({
    session: session,
    name: name
  }, function(err, model) {
    if(err) deferred.reject(err);
    else if(model === null) deferred.reject(new Error('Model not found!'));
    else model.remove(function(err) {
      if(err) deferred.reject(err);
      else {
        var path = Config.MODELS_PATH + '/' + name;
        fse.remove(path, function(err) {
          if(err) deferred.reject(err);
          else deferred.resolve();    
        });
      }
    });
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
 * Voxelifies a model with a maximal resolution of <size>.
 * The returned promise notifies about progress.
 * Returns a voxel JSON object. Throws error on format exceptions.
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