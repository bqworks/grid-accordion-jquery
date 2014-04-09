module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    appName: 'Grid Accordion',
    jsFileName: 'jquery.gridAccordion',
    cssFileName: 'grid-accordion',
    banner: '/*!\n' +
            '* <%= pkg.prettyName %> - v<%= pkg.version %>\n' +
            '* Homepage: <%= pkg.homepage %>\n' +
            '* Author: <%= pkg.author.name %>\n' +
            '* Author URL: <%= pkg.author.url %>\n*/\n',
    concat: {
      options: {
        separator: '\n\n',
        banner: '<%= banner %>'
      },
      dist: {
        src: [
          'src/js/jquery.gridAccordion.core.js',
          'src/**/*.js'
        ],
        dest: 'dist/js/<%= jsFileName %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        files: {
          'dist/js/<%= jsFileName %>.min.js': '<%= concat.dist.dest %>'
        }
      }
    },
    cssmin: {
      minify: {
        src: 'src/css/<%= cssFileName %>.css',
        dest: 'dist/css/<%= cssFileName %>.min.css'
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>', '<%= cssmin.minify.src %>'],
      tasks: ['jshint', 'concat', 'uglify', 'cssmin']
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'cssmin']);

};