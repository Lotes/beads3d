var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var GooglePlusStrategy = require('passport-google-plus');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ioCookieParser = require('socket.io-cookie-parser');
var database = require('./database/index');
var User = require('./resources/user');
var Upload = require('./resources/upload');
var Config = require('./config');
var path = require('path');
var Q = require('q');
var fse = require('fs-extra');

server.listen(8080);

/*io.use(ioCookieParser());
io.use(function(socket, next) {
  session(socket.request, {}, next);
});*/

app.set('view engine', 'ejs');  
app.set('views', __dirname + '/');

app.use(require("express-chrome-logger"));

app.use(cookieParser(Config.SESSION_SECRET));
app.use(bodyParser.json());
app.use(session({
  secret: Config.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: new Date(Date.now() + Config.SESSION_MAX_AGE)
  },
  store: new MongoStore({
    mongooseConnection: database.Connection
  })
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GooglePlusStrategy({
    clientId: Config.GOOGLE_PLUS_CLIENT_ID,
    clientSecret: Config.GOOGLE_PLUS_CLIENT_SECRET
  },
  function(tokens, profile, done) {
    User
      .put(profile.id, profile.displayName, profile.image.url)
      .then(function(user) {
        done(null, user, tokens);
      }, function(err) {
        done(err);
      });
  }
));
passport.serializeUser(function(user, done) {
  return done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User
    .get(id)
    .then(
      function(user) { done(null, user); },
      function(err) { done(err); }
    );
});

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  var firstScript = 'module.js';
  var appPath = path.join(__dirname, 'public', 'app');
  var scripts = [];
  var styles = [];
  fse.walk(appPath)
    .on('data', function(item) {
      var shortPath = item.path.substring(appPath.length+1).replace(/\\/g, '/'); 
      if(/\.js$/i.test(shortPath)) {
        if(shortPath !== firstScript)
          scripts.push(shortPath);
      } else if(/\.css$/i.test(shortPath))
        styles.push(shortPath);
    })
    .on('end', function() {
      res.render('index', {
        clientId: Config.GOOGLE_PLUS_CLIENT_ID,
        user: req.user,
        scripts: [firstScript].concat(scripts),
        styles: styles
      });
    });
});

app.post('/auth/google/callback', passport.authenticate('google'), function(req, res) {
  res.send(req.user);
});
app.get('/logout', function(req, res) {
  req.session.destroy(function(e){
    req.logout();
    res.status(200).end();
  });
});

Upload.setRoutes(app, function(req, res, next) {
  if(!req.isAuthenticated())
    res.status(401).end();
  else
    next();
});

/*io.sockets.on('connection', function (socket) {

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
*/
module.exports = app;