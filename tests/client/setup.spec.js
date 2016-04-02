var http = require('http'), 
    server; 

beforeAll(function() { 
  server = http.createServer(require('../../server')); 
  server.listen(0);
}); 
 
afterAll(function(){
  server.close(); 
});
