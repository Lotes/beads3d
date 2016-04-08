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
var Config = require('./config');
var path = require('path');
var Q = require('q');

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
//app.use(bodyParser.urlencoded({ extended: false }));
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
	res.render('index', {
    clientId: Config.GOOGLE_PLUS_CLIENT_ID,
    user: req.user
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

/*Upload.setup(app);

io.sockets.on('connection', function (socket) {

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