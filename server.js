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
var Model = require('./resources/Model');

server.listen(8080);

io.use(ioCookieParser());
io.use(function(socket, next) {
  session(socket.request, {}, next);
});

app.use(cookieParser());
app.use(session);
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

app.post('/uploads', upload.single('file'), function(req, res) {
	Model.create(req.file.buffer, req.session)
    .then(function(model) {
      console.log('Creating model... '+model.name);
      res.send(model.name);
    }, function(err) {
      console.log('Creating model... FAIL: '+err.message);
      res.status(500).send(err.message);
    });
});

app.get('/uploads', function(req, res) {
  Model.query({
    session: req.session
  }).then(function(models) {
    console.log('Enumerating models for session "'+req.session.cookie+'"... OK: '+models.length);
    var result = [];
    models.forEach(function(model) {
      result.push({
        name: model.name,
        size: model.size
      });
    });
    res.json(result);
  }, function(err) {
    console.log('Enumerating models for session "'+req.session.cookie+'"... FAIL: '+err.message);
    res.status(500).send(err.message);
  });
});

app.get('/uploads/:name', function(req, res) {
  Model.data(req.session, req.params.name)
    .then(function(data) {
      console.log('Reading model "'+req.params.name+'"... OK');
      res.header("Content-Type", "text/plain");
      res.send(data);
    }, function(err) {
      console.log('Reading model "'+req.params.name+'"... FAIL: '+err.message);
      res.status(500).send(err.message);
    });
});

io.sockets.on('connection', function (socket) {
	socket.on('initialize', function (data) {
    Model.beadify(socket.request.session, data.name, data.size)
      .then(function(data) {
        socket.emit('result', JSON.stringify(data));
      }, function(err) {
        socket.emit('fail', err.message);
      }, function(progress) {
        socket.emit('progress', JSON.stringify(progress));
      });
	});
});

console.log('Running!');

module.exports = app;