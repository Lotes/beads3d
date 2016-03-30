var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var multer = require('multer');
var upload = multer();
var cookieParser = require('cookie-parser');
var ioCookieParser = require('socket.io-cookie-parser');
var session = require('./middleware/session');
var Upload = require('./resources/upload');
var Session = require('./resources/session');
var database = require('./database/index');
var Config = require('./config');
var path = require('path');
var Q = require('q');

server.listen(8080);

io.use(ioCookieParser());
io.use(function(socket, next) {
  session(socket.request, {}, next);
});

app.use(require("express-chrome-logger"));

app.use(cookieParser());
app.use(session);
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

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
	Upload.uploadBuffer(req.session, req.file.originalname, req.file.buffer)
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
  Upload.enumerate(req.session)
    .then(function(list) {
      res.console.log('Enumerating uploads... OK');
      res.json(list);
    }, function(err) {
      res.console.log('Enumerating uploads... FAIL: '+err.message);
      res.status(500).send(err.message);
    });
});

app.get(/^\/uploads\/([^\/]+)\/(.*)$/, function(req, res) {
  var folder = req.params[0];
  var path = req.params[1];
  Upload.get(req.session, folder, path)
    .then(function(data) {
      res.console.log('Downloading uploaded file "'+folder+'/'+path+'"... OK');
      res.send(data);
    }, function(err) {
      res.console.log('Downloading uploaded file "'+folder+'/'+path+'"... FAIL: '+err.message);
      res.status(500).send(err.message);
    });
});

app['delete']('/uploads/:name', function(req, res) {
  Upload.remove(req.session, req.params.name)
    .then(function() {
      res.console.log('Deleting upload "'+req.params.name+'"... OK');
      res.end();
    }, function(err) {
      res.console.log('Deleting upload "'+req.params.name+'"... FAIL: '+err.message);
      res.status(500).send(err.message);
    });
});

io.sockets.on('connection', function (socket) {
	/*socket.on('initialize', function (data) {
    Model.beadify(socket.request.session, data.name, data.size)
      .then(function(data) {
        socket.emit('result', data);
      }, function(err) {
        socket.emit('fail', err.message);
      }, function(progress) {
        socket.emit('progress', progress);
      });
	});*/
});

console.log('Running!');

if(app.settings.env !== 'production') {
  console.log('Initializing development environment');
  Q.all([
    Session.clear(),
    Upload.clearTempDirectory(),
    Upload.clearSessionsDirectory()
  ]).then(function() {
    console.log('-cleared sessions, temporary and uploads directory');
    return Session.create(Config.DEVELOPMENT_SESSION);
  })
  .then(function(session) {
    console.log('-created development session "'+session.cookie+'"');
    var venusaurModelPath = path.join(Config.DEVELOPMENT_DATA_PATH, 'models', 'venusaur.zip');
    return Q.all([
      Upload.uploadLocalFile(session, venusaurModelPath),
      Upload.uploadLocalFile(session, venusaurModelPath)
    ]);
  })
  .then(function() {
    console.log('-uploaded demo models');
  })
  .fail(function(err) {
    console.log('-FAIL: '+err.message);
  });
  //TODO empty images
}

module.exports = app;