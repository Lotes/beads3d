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
	}
    /*watch: {
      all: {
        files: ['<%= jshint.all %>'],
        tasks: ['jshint', 'nodeunit'],
      },
    }*/
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-php');
  grunt.loadNpmTasks('grunt-express');
  
  grunt.registerTask('default', ['express']);
};