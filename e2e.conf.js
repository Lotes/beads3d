exports.config = {
  baseUrl: 'http://localhost:8080/',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['tests/client/**/*.spec.js']
};