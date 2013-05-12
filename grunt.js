module.exports = function( grunt ) {
  'use strict';

  grunt.loadNpmTasks('grunt-rigger');

  grunt.initConfig({

    pkg: '<json:package.json>',
    meta: {
      banner: '/*\n<%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n*/'
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', '<file_strip_banner:src/<%= pkg.name %>.js>', '<file_strip_banner:src/url-to-anchor.js>'],
        dest: 'lib/<%= pkg.name %>.js'
      }
    },
    rig: {
      amd: {
        src: ['<banner:meta.banner>', 'src/amd.js'],
        dest: 'lib/amd/<%= pkg.name %>.js'
      }
    },
    min: {
      standard: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'lib/<%= pkg.name %>.min.js'
      },
      amd: {
        src: ['<banner:meta.banner>', '<config:rig.amd.dest>'],
        dest: 'lib/amd/<%= pkg.name %>.min.js'
      }
    },
    lint: {
      files: ['grunt.js', 'src/super-simple-http-chat.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint concat rig min'
    },
    jshint: {
      options: {
        browser: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true
      },
      globals: {
        exports: true,
        module: false
      }
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'lint concat rig min');
};
