angular.module('beads3d').directive('uploadsTree', function(Loader, Upload) {
  return {
    restrict: 'E',
    scope: {
      uploads: '=',
      selectedFile: '='
    },
    link: function($scope, element, attr) {
      $scope.toggleNode = function(node) {
        node.expanded = !node.expanded;
      };
      $scope.selectNode = function(node) {
        $scope.selectedFile = { 
          id: node.id, 
          path: node.path 
        };
      };
      $scope.isNodeSelected = function(node) {
        return $scope.selectedFile !== null
          && $scope.selectedFile.id === node.id
          && $scope.selectedFile.path === node.path
          ;
      };
      
      var toRemove;
      var dialog = element.find('.removeDialog');
      $scope.tryRemoveUpload = function(id) {
        toRemove = id;
        dialog.modal('show');
      };
      $scope.removeUpload = function() {
        dialog.modal('hide');
        if($scope.selectedFile !== null && $scope.selectedFile.id === toRemove)
          $scope.selectedFile = null;
        Upload.remove(toRemove).then(function() {
          $scope.uploads = $scope.uploads.filter(function(upload) {
            return upload.id != toRemove;
          });
        });
      };
    
      $scope.uploadNodes = [];
      $scope.$watch('uploads', function() {
        $scope.uploadNodes = [];
        $scope.uploads.forEach(function(upload) {
          var uploadNode = {
            type: 'upload',
            id: upload.id,
            name: upload.name,
            expanded: true,
            children: {},
            size: upload.size
          };
          upload.files.forEach(function(filePath) {
            if(!/\.obj$/i.test(filePath))
              return;
            var node = uploadNode;
            var parts = filePath.split(/[\/\\]/);
            for(var index=0; index<parts.length; index++) {
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
                    id: upload.id,
                    name: part,
                    path: filePath.replace(/\\/g, '/'),
                    children: {},
                  };
              node = node.children[part];
            }
          });
          $scope.uploadNodes.push(uploadNode);
        });
      });
    },
    replace: true,
    templateUrl: 'app/views/uploadsTree.html'
  };
});