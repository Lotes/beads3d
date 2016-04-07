'use strict';

var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      client: {
        files: ['client/**/*.js'],
        tasks: ['client']
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
        src: ['tests/server/**/*.spec.js']
      }
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
  grunt.loadNpmTasks('grunt-protractor-runner');
  
  grunt.registerTask('client', ['browserify:client']);
  grunt.registerTask('test-client', ['client', 'protractor:client']);
  grunt.registerTask('test-server', ['mochaTest:server']);
  grunt.registerTask('debug', ['node-inspector:tests']);
  grunt.registerTask('doc', ['apidoc:server']);
};