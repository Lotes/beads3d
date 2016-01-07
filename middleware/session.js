var Session = require('../resources/session');

var SESSION_ID = 'session';
var SESSION_AGE = Session.MAX_AGE_IN_DAYS * 24 * 60 * 60 * 1000;

function session(req, res, next) {
  var cookie = req.cookies[SESSION_ID];
  if (cookie === undefined) {
    Session
      .create()
      .then(function(session) {
        console.log('Created new session: '+session.cookie);
        req.sessionId = session.cookie;
        req.session = session;
        res.cookie(SESSION_ID, session.cookie, { maxAge: SESSION_AGE, httpOnly: true });
        next();
      }, next);
  } else {
    Session
      .get(cookie)
      .then(function(session) {
        if(session !== null) {
          req.sessionId = cookie;
          req.session = session;
          Session.access(cookie).then(next, next);
        } else {
          console.log('Session is not ok! -> clear & refresh');
          res.cookie(SESSION_ID, null);
          res.redirect(req.originalUrl);
        }
      }, next);
  } 
}

module.exports = session;