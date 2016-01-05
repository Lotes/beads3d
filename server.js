var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var process = require('child_process');
var fs = require('fs');
var multer = require('multer');
var upload = multer();

server.listen(8080);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

function generateRandomString(length) {
	var characters = 'abcdefghijklmnopqrstuvwxyz_0123456789';
	var result = '';
	while(length > 0) {
		result += characters[Math.floor(Math.random() * characters.length)];
		length--;
	}
	return result;
}

function newDirectory(cb) {
	var name = generateRandomString(20);
	var path = __dirname + '/models/'+name;
	fs.mkdir(path, function(err) {
        if (err)
            newDirectory(callback);
        else 
			cb(null, path, name);
    });
}

app.post('/uploads', upload.single('file'), function(req, res) {
	//TODO test file size over whole session
  newDirectory(function(err, path, name) {
		if(err)
			return res.status(500).send('Could not create new directory!');
		var newPath = path+'/model.obj';
    fs.writeFile(newPath, req.file.buffer, function (err) {
      res.send(name);
    });
	});
});

app.get('/uploads', function(req, res) {
  res.status(500).send('Not implemented yet.');
});

app.get('/uploads/:id', function(req, res) {
  res.status(500).send('Not implemented yet.');
});

io.sockets.on('connection', function (socket) {
	var beadify = null;
	socket.on('initialize', function (data) {
		var cmd = __dirname + '/beadifier/beadify "../'+data.fileName+'" '+data.size+' result.json';
		if(beadify) 
			beadify.kill();
		beadify = process.exec(cmd, {cwd: 'beadifier'});
		var text = '';
		var pattern = /(\d+)\/(\d+)/;
		function parseText() {
			var match = pattern.exec(text);
			if(match != null) {
				socket.emit('progress', {
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
			socket.emit('result', JSON.parse(fs.readFileSync('beadifier/result.json')));
		});
	});
});

console.log('Running!');

module.exports = app;