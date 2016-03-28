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
  
  grunt.registerTask('test', ['mochaTest:server']);
  grunt.registerTask('debug', ['node-inspector:tests']);
  grunt.registerTask('client', ['browserify:client']);
};