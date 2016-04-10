angular.module('beads3d').config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'app/views/frontpage.html',
      authenticated: false
    })
    .when('/search', {
      templateUrl: 'app/views/search.html',
      controller: 'SearchController',
      authenticated: false
    })
    .when('/search/:pattern*', {
      templateUrl: 'app/views/search.html',
      controller: 'SearchController',
      authenticated: false
    })
    .when('/new', {
      templateUrl: 'app/views/new.html',
      authenticated: true
    })
    .when('/edit', {
      templateUrl: 'app/views/edit.html',
      authenticated: true
    })
    .when('/impress', {
      templateUrl: 'app/views/impress.html',
      authenticated: false
    })
    .when('/import', {
      templateUrl: 'app/views/import.html',
      controller: 'ImportController',
      authenticated: true
    })
    .when('/beadify/:model*', {
      templateUrl: 'app/views/beadify.html',
      controller: 'BeadifyController',
      authenticated: true
    })
    .otherwise({
      redirectTo: '/'
    });
})
.run(function($rootScope, $location, Auth) {
  $rootScope.$on('$routeChangeStart', function (event, next, current) {
    if(next.$$route.authenticated && Auth.getUser() == null) {
      event.preventDefault();
      alert('Login required!');
      $location.path('/');
    }
  });
});