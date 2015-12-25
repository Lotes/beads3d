'use strict';

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
  
  grunt.registerTask('default', ['php:server']);
};