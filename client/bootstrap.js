module.exports = function(app) {
  app.config(function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/frontpage.html',
        authenticated: false
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'SearchController',
        authenticated: false
      })
      .when('/search/:pattern*', {
        templateUrl: 'views/search.html',
        controller: 'SearchController',
        authenticated: false
      })
      .when('/new', {
        templateUrl: 'views/new.html',
        authenticated: true
      })
      .when('/edit', {
        templateUrl: 'views/edit.html',
        authenticated: true
      })
      .when('/impress', {
        templateUrl: 'views/impress.html',
        authenticated: false
      })
      .when('/import', {
        templateUrl: 'views/import.html',
        controller: 'ImportController',
        authenticated: true
      })
      .when('/beadify/:model*', {
        templateUrl: 'views/beadify.html',
        controller: 'BeadifyController',
        authenticated: true
      })
      .otherwise({
        redirectTo: '/'
      });
  });
  app.run(function($rootScope, $location, Auth) {
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
      if(next.$$route.authenticated && Auth.getUser() == null) {
        event.preventDefault();
        alert('Login required!');
        $location.path('/');
      }
    });
  });
};