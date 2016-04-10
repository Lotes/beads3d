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
        src: ['tests/server/**/*.spec.js']
      }
    },
    karma: {
      client: {
        configFile: 'karma.conf.js'
      }
    },
    mocha_istanbul: {
      server: {
        src: 'tests/server/**/*.spec.js',
        options: {
          mask: '*.spec.js',
          timeout: 20000,
          coverageFolder: 'coverage/server'
        }
      },
    },
    protractor: {
      options: {
        configFile: "node_modules/protractor/example/conf.js",
        keepAlive: true,
        noColor: false,
        args: {
        }
      },
      client: {
        options: {
          configFile: 'e2e.conf.js',
          args: {}
        }
      },
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
  grunt.loadNpmTasks('grunt-apidoc');
  grunt.loadNpmTasks('grunt-protractor-runner');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-karma');
  
  grunt.registerTask('test-e2e', ['protractor:client']);
  grunt.registerTask('test-client', ['karma:client']);
  grunt.registerTask('test-server', ['mochaTest:server']);
  grunt.registerTask('coverage-server', ['mocha_istanbul:server']);
  grunt.registerTask('test', ['test-server', 'test-client', 'test-e2e']);
  grunt.registerTask('debug', ['node-inspector:tests']);
  grunt.registerTask('doc', ['apidoc:server']);
};