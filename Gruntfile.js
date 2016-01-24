'use strict';

var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    php: {
        server: {
            options: {
                port: 8080,
                base: '.',
                keepalive: true,
                open: false
            }
        }
    },
    express: {
        server: {
            options: {
                script: 'server.js'
            }
        }
    },
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
  grunt.loadNpmTasks('grunt-php');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-node-inspector');
  
  grunt.registerTask('default', ['express']);
  grunt.registerTask('test', ['mochaTest:server']);
  grunt.registerTask('debug', ['node-inspector:tests']);
};