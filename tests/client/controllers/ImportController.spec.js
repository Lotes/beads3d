var USER = null;

describe('ImportController', function() {
  beforeEach(module('beads3d'));
  
  var $controller, $scope, controller;
  
  beforeEach(inject(function(_$controller_, $rootScope){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
    $scope = $rootScope.$new();
    controller = $controller('ImportController', { $scope: $scope });
  }));
  
  it('should run in Karma', function() {});
});