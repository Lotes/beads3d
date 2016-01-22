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
          clearRequireCache: false
        },
        src: ['tests/**/*.spec.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-php');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-mocha-test');
  
  grunt.registerTask('default', ['express']);
  grunt.registerTask('test', ['mochaTest:server']);
};