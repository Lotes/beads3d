module.exports = function randomString(length) {
	var characters = 'abcdefghijklmnopqrstuvwxyz_0123456789';
	var result = '';
	while(length > 0) {
		result += characters[Math.floor(Math.random() * characters.length)];
		length--;
	}
	return result;
};