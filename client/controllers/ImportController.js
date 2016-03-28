module.exports = function(app) {
  app.controller('ImportController', function($scope, Upload, $window, Loader, $location) {
    var uploadButton = $('#uploadButton');
    $scope.uploadFile = null;
    $scope.uploading = false;
    $scope.uploadProgress = 0;
    $scope.upload = function() {
      uploadButton.click();
    };
    $scope.$watch('uploadFile', function() {
      if($scope.uploadFile === null)
        return;
      Loader
      .upload('/uploads', $scope.uploadFile)
      .then(function() {
        $scope.uploading = false;
        $scope.refresh();
      }, function(e) {
        $scope.uploading = false;
        alert(e.message);
      }, function(progress) {
        $scope.uploadProgress = progress;
      });
      $scope.uploading = true;
      $scope.uploadFile = null;
      uploadButton.parent('form').trigger('reset');
    });
    
    $scope.selection = {};
    $scope.selection.model = null;
    $scope.selection.model3D = new THREE.Object3D();
    $scope.$watch('selection.model', function() {
      $scope.selection.model3D = new THREE.Object3D();
      if($scope.selection.model === null)
        return;
      Loader.loadOBJ('/uploads/'+$scope.selection.model)
        .then(function(obj) {
          $scope.selection.model3D = new THREE.Object3D();
          $scope.selection.model3D.add(obj);
          var bbox = new THREE.Box3().setFromObject(obj);
          var size = bbox.size();
          var scale = 1/Math.max(size.x, size.y, size.z);
          $scope.selection.model3D.scale.set(scale, scale, scale);
        });
    });
    
    $scope.toggleNode = function(node) {
      node.expanded = !node.expanded;
    };
    $scope.uploads = {};
    function addFile(file) {
      var parts = file.path.split(/[\/\\]/);
      var uploadName = parts[0];
      if(!(uploadName in $scope.uploads))
        $scope.uploads[uploadName] = {
          type: 'upload',
          expanded: true,
          name: uploadName,
          children: {}
        };
      var node = $scope.uploads[uploadName];
      for(var index=1; index<parts.length; index++) {
        var part = parts[index];
        if(!(part in node.children))
          if(index < parts.length - 1)
            node.children[part] = {
              type: 'directory',
              expanded: false,
              name: part,
              children: {}
            };
          else
            node.children[part] = {
              type: 'file',
              name: part,
              path: file.path.replace(/\\/g, '/'),
              children: {},
              size: file.size
            };
        node = node.children[part];
      }
    }
    $scope.refresh = function() {
      Upload.enumerate().then(function(res) {
        $scope.uploads = {};
        res.data.forEach(function(file) {
          if(/\.obj$/i.test(file.path))
            addFile(file);
        });
      });
    };
    
    $scope.next = function() {
      $location.path('/beadify/'+$scope.selection.model);
    };
    $scope.back = function() {
      $location.path('/new');
    };
    
    var toRemove;
    $scope.tryRemoveUpload = function(name) {
      toRemove = name;
      $('#removeDialog').modal('show');
    };
    $scope.removeUpload = function() {
      $('#removeDialog').modal('hide');
      $scope.selection.model = null;
      Upload.remove(toRemove).then(function() {
        $scope.refresh();
      });
    };
    
    $scope.refresh();
  });
};