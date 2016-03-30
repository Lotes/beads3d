'use strict';

var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    mochaTest: {
      server: {
        options: {
          reporter: 'nyan',
          quiet: false,
          timeout: 5000,
          clearRequireCache: false
        },
        src: ['tests/**/*.spec.js']
      }
    },
    browserify: {
    	client: {
    		  	files: {
    	    		'public/app/app.js': ['client/**/*.js']
    	    	}
    	}
    },
    apidoc: {
      server: {
        src: '.',
        dest: 'apidoc/',
        options: {
          excludeFilters: [ 'node_modules', 'ignore', 'client', 'public' ]
        }
      }
    },
    'node-inspector': {
      tests: {
        options: {
          'web-host': 'localhost',
          'web-port': 1337,
          'debug-port': 5857,
          'save-live-edit': true,
          'preload': false,
          'hidden': ['node_modules']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-node-inspector');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-apidoc');
  
  grunt.registerTask('test', ['mochaTest:server']);
  grunt.registerTask('debug', ['node-inspector:tests']);
  grunt.registerTask('client', ['browserify:client']);
  grunt.registerTask('doc', ['apidoc:server']);
};