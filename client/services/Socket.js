module.exports = function(app) {
	app.provider('Socket', function() {
		var socket = io.connect();
		this.$get = function() {
			return socket;
		};
	});
};