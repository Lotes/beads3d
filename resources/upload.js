var Q = require('q');
var Config = require('../config');
var database = require('../database/index');
var Upload = database.Upload;
var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var locks = require('locks');
var randomString = require('./randomString');
var process = require('child_process');

//clears all files, folders and database entries
//TODO dont forget to erase stars
function clear() {
  var deferred = Q.defer();
  fse.emptyDir(Config.TEMP_PATH, function(err) {
    if(err) return deferred.reject(err);
    fse.emptyDir(Config.UPLOADS_PATH, function(err) {
      if(err) deferred.reject(err);
      else Upload.remove({}, function(err) {
        if(err) deferred.reject(err);
        else deferred.resolve();
      });
    });
  });
  return deferred.promise;
}

//get all files (as urls and sizes) for one user
function enumerate(user) {
  var deferred = Q.defer();
  Upload.find({
    owner: user
  }, function(err, uploads) {
    if(err) deferred.reject(err);
    else deferred.resolve(uploads);
  });
  return deferred.promise;
}

var tempZipFileIndex = 0;
var uploadMutexs = {};

/**
 * Unpacks a OBJs from zip file and all its MTL and textures. Converts TGAs to PNGs.
 */
function unpack(sourceFileName, destinationFolder) {
  var deferred = Q.defer();
  var command = Config.UNPACKER_EXECUTABLE_PATH + ' "' + sourceFileName + '" "'+destinationFolder+'"';
  var zipProcess = process.exec(command, {cwd: Config.TOOLS_PATH });
  //handle errors
  var errorMessage = '';
  zipProcess.stdout.on('data', function(data) {
    errorMessage += data;
  });
  //handle exit
  zipProcess.on('exit', function(code) {
    if(code === 0) return deferred.resolve();
    deferred.reject(new Error('Unpack error while ['+command+']: '+errorMessage));
  });
  return deferred.promise;
}

//returns true iff file/directory exists
function exists(path) {
  var deferred = Q.defer();
  fs.stat(path, function(err, stats) {
    if(err) {
      if(err.code === 'ENOENT')
        deferred.resolve(false);
      else 
        deferred.reject(err);
    } else 
      deferred.resolfe(true);
  });
  return deferred.promise;
}

/**
 * Create a folder for a new upload.
 */
function createUploadFolder() {
  var deferred = Q.defer();
  var folderName = randomString(20);
  var folderPath = path.join(Config.UPLOADS_PATH, folderName);
  exists(folderPath)
    .then(function(ok) {
      if(!ok)
        fse.mkdirs(folderPath, function(err) {
          if(err) return deferred.reject(err);
          deferred.resolve(folderName);
        });
      else
        createUploadFolder()
          .then(
            function(newFolderName) { deferred.resolve(newFolderName); },
            function(err) { deferred.reject(err); }
          );
    }, function(err) {
      deferred.reject(err);
    });
  return deferred.promise;
}

/**
 * Locks an upload for a user. Call done() if finished.
 * Example:
 *   lockUserUploads(session, function(done) {
 *     work();
 *     done();
 *   });
 */
function lockUserUpload(user, action) {
  var name = user.id;
  if(!(name in uploadMutexs))
    uploadMutexs[name] = locks.createMutex();
  var mutex = uploadMutexs[name];
  mutex.lock(function() {
    action(function() {
      mutex.unlock();
    });
  });
}

//determines the used space of a user in bytes
function usedSpace(user) {
  return enumerate(user)
    .then(function(uploads) {
      var sumSize = 0;
      uploads.forEach(function(upload) {
        sumSize += upload.size;
      });
      return sumSize;
    });
}

/**
 * Uploads a ZIP archive to an user profile.
 * If it is a ZIP file it will be unpacked. All OBJ, MTL, TGA and PNG files will be copied.
 */
function uploadBuffer(user, name, data) {
  var deferred = Q.defer();
  //it's a zip file!
  //1. lock user
  lockUserUpload(user, function(done) {
    deferred.promise.finally(done); //automated unlocking session mutex
    tempZipFileIndex++;
    var tempZipFilePath = path.join(Config.TEMP_PATH, tempZipFileIndex+'.zip');
    //2. create folder
    createUploadFolder()
      .then(function(folderName) {
        var folderPath = path.join(Config.UPLOADS_PATH, folderName);
        //3. write zip file
        fse.outputFile(tempZipFilePath, data, function(err) {
          if(err) return deferred.resolve(err);
          deferred.promise.finally(function() { fse.remove(tempZipFilePath); }); //automated removing of zip file
          deferred.promise.fail(function() { fse.remove(folderPath); }); //automated removing of upload folder when failing
          //4. unpack zip file
          unpack(tempZipFilePath, folderPath)
            .then(function() {
              //5. read file stats for size determination
              var sumSize = 0;
              var files = [];
              var error = null;
              fse.walk(folderPath)
                .on('data', function(item) {
                  var file = item.path.substring(folderPath.length + 1);
                  if(file.length === 0 || item.stats.size === 0)
                    return;
                  files.push(file);
                  sumSize += item.stats.size; 
                })
                .on('error', function(err3) { error = err3; })
                .on('end', function() {
                  if(error)
                    return deferred.reject(error);
                  if(sumSize > Config.MAX_SPACE_PER_SESSION)
                    return deferred.reject(new Error('Session space exceeded! Upload will be deleted. Please free space by deleting other uploads.'));
                  //6. check if user space limit is violated
                  if(sumSize === 0)
                    return deferred.reject(new Error('Upload was empty!'));
                  usedSpace(user)
                    .then(function(space) {
                      if(sumSize + space > Config.MAX_SPACE_PER_USER)
                        deferred.reject(new Error('Upload hits per user space limit!'));
                      else {
                        //7. create database entry
                        Upload.create({
                          owner: user,
                          name: name,
                          folderName: folderName,
                          files: files,
                          size: sumSize
                        }, function(err4, upload) {
                          if(err4) deferred.reject(err4);
                          else deferred.resolve(upload);
                        });
                      }
                    })
                    .fail(function(err2) { deferre.reject(err2); });
                });
            }, function(err2) { deferred.reject(err2); });
        });
      }, function(err) { deferred.reject(err); });
  });
  return deferred.promise;
}

//uploads a local zip file
function uploadLocal(user, zipPath) {
 var deferred = Q.defer();
  fse.readFile(zipPath, function(err, data) {
    if(err)
      return deferred.reject(err);
    var name = path.basename(zipPath);
    uploadBuffer(user, name, data)
      .then(
        function(result) { deferred.resolve(result); }, 
        function(ex) { deferred.reject(ex); }
      );
  });
  return deferred.promise;
}

module.exports = {
  clear: clear,
  enumerate: enumerate,
  uploadLocal: uploadLocal,
  uploadBuffer: uploadBuffer,
  usedSpace: usedSpace,
  
  /*get: get,
  remove: remove,
  
  registerRoutes: registerRoutes*/
};