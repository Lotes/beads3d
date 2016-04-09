var app = angular.module('beads3d', ['ui.bootstrap-slider', 'ngRoute', 'mgo-angular-wizard', 'directive.g+signin']);

require('./bootstrap')(app);

require('./services/Upload')(app);
require('./services/Loader')(app);
require('./services/Socket')(app);
require('./services/Auth')(app);

require('./controllers/MainController')(app);
require('./controllers/ImportController')(app);
require('./controllers/SearchController')(app);
require('./controllers/BeadifyController')(app);

require('./directives/viewer')(app);
require('./directives/fileModel')(app);
require('./directives/connectButton')(app);

require('./filters/bytes')(app);

module.exports = app;