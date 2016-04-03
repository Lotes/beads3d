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

Upload.setup(app);

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