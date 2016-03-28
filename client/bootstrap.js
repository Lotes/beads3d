module.exports = function(app) {
  app.config(function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/frontpage.html'
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'SearchController'
      })
      .when('/search/:pattern*', {
        templateUrl: 'views/search.html',
        controller: 'SearchController'
      })
      .when('/new', {
        templateUrl: 'views/new.html'
      })
      .when('/edit', {
        templateUrl: 'views/edit.html'
      })
      .when('/impress', {
        templateUrl: 'views/impress.html'
      })
      .when('/import', {
        templateUrl: 'views/import.html',
        controller: 'ImportController'
      })
      .when('/beadify/:model', {
        templateUrl: 'views/beadify.html',
        controller: 'BeadifyController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
};