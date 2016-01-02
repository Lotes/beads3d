var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var process = require('child_process');
var fs = require('fs');

server.listen(8080);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

io.sockets.on('connection', function (socket) {
	socket.on('initialize', function (data) {
		var cmd = __dirname + '/beadifier/beadify "../'+data.fileName+'" '+data.size+' result.json';
		console.log(cmd);
		var beadify = process.exec(cmd, {cwd: 'beadifier'});
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