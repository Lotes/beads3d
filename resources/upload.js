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
var locks = require('locks');
var multer = require('multer');
var upload = multer();

//state variables
var uploadMutexs = {};

/**
 * Locks an upload for a session. Call done() if finished.
 * Example:
 *   lockSessionUploads(session, function(done) {
 *     work();
 *     done();
 *   });
 */
function lockSessionUpload(session, action) {
  var name = session.cookie;
  if(!(name in uploadMutexs))
    uploadMutexs[name] = locks.createMutex();
  var mutex = uploadMutexs[name];
  mutex.lock(function() {
    action(function() {
      mutex.unlock();
    });
  });
}

/**
 * Create a folder for a new upload.
 */
function createUploadFolder(session, initialFolderName, index) {
  var deferred = Q.defer();
  var folderName = path.join(Config.SESSIONS_PATH, session.cookie, initialFolderName);
  if(typeof(index) === 'number')
    folderName += ' ('+index+')';
  fs.stat(folderName, function(err, stats) {
    if(err) {
      if(err.code === 'ENOENT') {
        //not found -> create
        fse.mkdirs(folderName, function(err3) {
          if(err3) return deferred.reject(err3);
          deferred.resolve(folderName);
        });
      } else 
        deferred.reject(err);
    } else {
      //exists already -> rename
      var newIndex = index ? index+1 : 2;
      createUploadFolder(session, initialFolderName, newIndex)
        .then(
          function(result) { deferred.resolve(result); },
          function(err2) { deferred.reject(err2); }
        );
    }
  });
  return deferred.promise;
}

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

/**
 * Unpacks a OBJs from zip file and all its MTL and textures. Converts TGAs to PNGs.
 */
function unpack(sourceFileName, destinationFolder) {
  var deferred = Q.defer();
  var command = Config.UNPACKER_EXECUTABLE_PATH + ' "' + sourceFileName + '" "'+destinationFolder+'"';
  var zipProcess = process.exec(command, {cwd: Config.VOXELIFY_PATH });
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

var tempZipFileIndex = 0;
/**
 * Uploads a file or ZIP archive to a session.
 * If it is a ZIP file it will be unpacked. All OBJ, MTL, TGA and PNG files will be copied.
 * @throws an exception, otherwise (file not accepted)
 * @throws an exception, if session space was exceeded.
 * @returns upload folder name on success
 */
function uploadBuffer(session, name, data) {
  var deferred = Q.defer();
  var lowerCaseName = _.toLower(name);
  var dotIndex = name.lastIndexOf('.');
  var sessionPath = path.join(Config.SESSIONS_PATH, session.cookie);
  var folderName = dotIndex > -1 ? name.substr(0, dotIndex) : name;
  folderName = folderName.replace(/[ \\\/]/g, '');
  if(/\.(zip)$/.test(lowerCaseName)) {
    //it's a zip file!
    //1. lock the session folder
    lockSessionUpload(session, function(done) {
      deferred.promise.finally(done); //automated unlocking session mutex
      tempZipFileIndex++;
      var tempZipFilePath = path.join(Config.TEMP_PATH, tempZipFileIndex+'.zip');
      //2. create folder
      createUploadFolder(session, folderName)
        .then(function(folderPath) {
          //3. write zip file
          fse.outputFile(tempZipFilePath, data, function(err) {
            if(err) return deferred.resolve(err);
            deferred.promise.finally(function() { fse.remove(tempZipFilePath); }); //automated removing of zip file
            deferred.promise.fail(function() { fse.remove(folderPath); }); //automated removing of upload folder when failing
            //4. unpack zip file
            unpack(tempZipFilePath, folderPath)
              .then(
                function() {
                  //5. check session space limit
                  var sumSize = 0;
                  fse.walk(sessionPath)
                    .on('data', function(item) { sumSize += item.stats.size; })
                    .on('error', function(err3) { deferred.reject(err3); })
                    .on('end', function() {
                      if(sumSize > Config.MAX_SPACE_PER_SESSION)
                        return deferred.reject(new Error('Session space exceeded! Upload will be deleted. Please free space by deleting other uploads.'));
                      deferred.resolve(path.basename(folderPath));
                    });
                }, function(err2) {
                  deferred.reject(err2);
                }
              );
          });
        }, function(err) {
          deferred.reject(err);
        });
    });
  } else {
    //it's not accepted
    deferred.reject(new Error('Unacceptable file type ('+name+')!'));
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

/**
 * @returns a listing of all files uploaded in this session
 */
function enumerate(session) {
  var deferred = Q.defer();
  var sessionPath = path.join(Config.SESSIONS_PATH, session.cookie);
  var result = [];
  fse.walk(sessionPath)
    .on('data', function(item) { 
      if(!item.stats.isFile())
        return;
      result.push({
        path: item.path.substr(sessionPath.length+1),
        size: item.stats.size
      });
    })
    .on('error', function(err) { deferred.reject(err); })
    .on('end', function() {
      deferred.resolve(result);
    });;
  return deferred.promise;
}

/**
 * Get a specific file of an upload folder.
 */
function get(session, uploadFolderName, filePath) {
  var deferred = Q.defer();
  var fullFilePath = path.join(Config.SESSIONS_PATH, session.cookie, uploadFolderName, filePath);
  var parts = fullFilePath.split(/[\/\\]/);
  var index = _.findIndex(parts, function(part) { return part === '..'; });
  if(index !== -1)
    deferred.reject(new Error('".." is not allowed!'));
  fs.stat(fullFilePath, function(err, stats) {
    if(err) return deferred.reject(err);
    if(!stats.isFile()) return deferred.reject(new Error('Path is not a file!'));
    fse.readFile(fullFilePath, function(err2, data) {
      if(err) return deferred.reject(err);
      deferred.resolve(data);
    });
  });
  return deferred.promise;
}

/**
 * Remove an entire upload folder.
 */
function remove(session, uploadFolderName) {
  var deferred = Q.defer();
  if(/([\\\/])/.test(uploadFolderName) || uploadFolderName === '..')
    deferred.reject(new Error('Invalid upload name!'));
  else {
    var fullUploadPath = path.join(Config.SESSIONS_PATH, session.cookie, uploadFolderName);
    fse.remove(fullUploadPath, function(err) {
      if(err) return deferred.reject(err);
      deferred.resolve();
    });
  }
  return deferred.promise;  
}

/**
 * Setup server routes for Upload resource.
 */
function setup(app) {
  /**
   * @api {post} /uploads
   * @apiName CreateUpload
   * @apiGroup Upload
   * @apiDescription Uploads a zip archive containing OBJ and PNG files for current session.
   *
   * @apiSuccess {String} folderName
   *
   * @apiSuccessExample Success-Response
   *     HTTP/1.1 200 OK
   *     "pikachu"
   *
   * @apiError TypeNotAccepted file is no valid zip file
   * @apiError SessionSpaceExceeded session space limit reached
   */
  app.post('/uploads', upload.single('file'), function(req, res) {
    uploadBuffer(req.session, req.file.originalname, req.file.buffer)
      .then(function(folderName) {
        res.console.log('Uploading... --> '+folderName);
        res.send(folderName);
      }, function(err) {
        res.console.log('Uploading... FAIL: '+err.message);
        res.status(500).send(err.message);
      });
  });

  /**
   * @api {get} /uploads
   * @apiName EnumerateUploads
   * @apiGroup Upload
   * @apiDescription Enumerates all uploaded files of a session.
   *
   * @apiSuccess {Object[]} files list of all files
   * @apiSuccess {String} files.path path of a file
   * @apiSuccess {Number} size of that file in bytes
   *
   * @apiSuccessExample Success-Response
   *     HTTP/1.1 200 OK
   *     [
   *         {
   *             "path": "pikachu/model.obj",
   *             "size": 123456
   *         },
   *         {
   *             "path": "pikachu/texture.png",
   *             "size": 654321
   *         }
   *     ]
   */
  app.get('/uploads', function(req, res) {
    enumerate(req.session)
      .then(function(list) {
        res.console.log('Enumerating uploads... OK');
        res.json(list);
      }, function(err) {
        res.console.log('Enumerating uploads... FAIL: '+err.message);
        res.status(500).send(err.message);
      });
  });

  /**
   * @api {get} /uploads/:folder/:file*
   * @apiName GetUploadedFile
   * @apiGroup Upload
   * @apiDescription Downloads a file from a session.
   */
  app.get(/^\/uploads\/([^\/]+)\/(.*)$/, function(req, res) {
    var folder = req.params[0];
    var path = req.params[1];
    get(req.session, folder, path)
      .then(function(data) {
        res.console.log('Downloading uploaded file "'+folder+'/'+path+'"... OK');
        res.send(data);
      }, function(err) {
        res.console.log('Downloading uploaded file "'+folder+'/'+path+'"... FAIL: '+err.message);
        res.status(500).send(err.message);
      });
  });

  /**
   * @api {delete} /uploads/:folder
   * @apiName DeleteUpload
   * @apiGroup Upload
   * @apiDescription Deletes an upload from a session.
   */
  app['delete']('/uploads/:name', function(req, res) {
    remove(req.session, req.params.name)
      .then(function() {
        res.console.log('Deleting upload "'+req.params.name+'"... OK');
        res.end();
      }, function(err) {
        res.console.log('Deleting upload "'+req.params.name+'"... FAIL: '+err.message);
        res.status(500).send(err.message);
      });
  });
}

module.exports = {
  clearTempDirectory: clearTempDirectory,
  clearSessionsDirectory: clearSessionsDirectory,
  
  uploadLocalFile: uploadLocalFile,
  uploadBuffer: uploadBuffer,
  
  enumerate: enumerate,
  get: get,
  remove: remove,
  
  setup: setup
};