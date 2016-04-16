// Karma configuration
// Generated on Sun Apr 10 2016 12:22:47 GMT+0200 (Mitteleuropäische Sommerzeit)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'public/bower_components/jquery/dist/jquery.min.js',
      
      'public/bower_components/angular/angular.min.js',
      'public/bower_components/angular-mocks/angular-mocks.js',
      
      'public/bower_components/bootstrap/dist/js/bootstrap.min.js',
      'public/bower_components/three.js/three.min.js',
      'public/bower_components/angular-route/angular-route.min.js',
      'public/bower_components/angular-wizard/dist/angular-wizard.min.js',
      'public/bower_components/angular-directive.g-signin/google-plus-signin.js',
      'public/bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
      'public/bower_components/socket.io-client/socket.io.js',
      'public/bower_components/spin.js/spin.js',
      'public/bower_components/angular-spinner/angular-spinner.js',
      
      'public/utils/MTLLoader.js',
      'public/utils/OBJMTLLoader.js',
      'public/utils/OrbitControls.js',
      'public/utils/angular-bootstrap-slider/slider.js',
      
      'public/app/module.js',
      'public/app/**/*.js',
      /*'public/app/bootstrap.js',
      'public/app/controllers/BeadifyController.js',
      'public/app/controllers/ImportController.js',
      'public/app/controllers/MainController.js',
      'public/app/controllers/SearchController.js',
      'public/app/directives/connectButton.js',
      'public/app/directives/fileModel.js',
      'public/app/directives/viewer.js',
      'public/app/filters/bytes.js',
      'public/app/services/Auth.js',
      'public/app/services/Loader.js',
      'public/app/services/Upload.js',
      'public/app/services/Socket.js',*/
      
      'tests/client/**/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'public/app/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
    
    // optionally, configure the reporter 
    coverageReporter: {
      type : 'html',
      dir : 'coverage/client'
    }
  })
}
