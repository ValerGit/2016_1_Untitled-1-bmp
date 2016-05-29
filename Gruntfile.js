module.exports = function (grunt) {

  grunt.initConfig({
    // https://www.npmjs.com/package/grunt-contrib-less
    less: {
      dev: {
        options: {
          paths: ['assets/less']
        },
        files: {
          'build-dev/css/main.css': 'assets/less/main.less'
        }
      },
      build: {
        options: {
          paths: ['assets/less'],
          compress: true
        },
        files: {
          'build/css/main.min.css': 'assets/less/main.less'
        }
      }
    },

    postcss: {
      // https://www.npmjs.com/package/grunt-postcss
      options: {
        processors: [
          require('autoprefixer')({ browsers: ['last 5 versions'] }),
          require('cssnano')({ discardComments: { removeAll: true } })
        ]
      },
      dev: {
        src: 'build-dev/css/main.css'
      },

      build: {
        src: 'build/css/main.min.css'
      }
    },

    requirejs: {
      // https://www.npmjs.com/package/grunt-requirejs
      build: {
        options: {
          almond: true,
          baseUrl: 'assets/js',
          mainConfigFile: 'assets/js/config.js',
          include: ['main'],
          out: 'build/js/main.min.js',
          preserveLicenseComments: false
        }
      }
    },

    uglify: {
      // https://github.com/gruntjs/grunt-contrib-uglify
      options: {
        banner: 'var hash="<%= grunt.template.today("yyyymmddHHMMss") %>";',
      },
      offline_build: {
        files: {
          'build/offline.js': 'assets/js/offline.js'
        }
      },
      build: {
        files: {
          'build/js/main.min.js': 'build/js/main.min.js'
        }
      }
    },

    jade: {
      // https://www.npmjs.com/package/grunt-jade
      dev: {
        files: {
          'build-dev': 'layouts/**/*.jade'
        },
        options: {
          pretty: true,
          client: false,
          locals: {
            dev: true
          }
        }
      },
      build: {
        files: {
          'build': 'layouts/**/*.jade'
        },
        options: {
          client: false,
          locals: {
            dev: false
          }
        }
      }
    },

    copy: {
      // https://www.npmjs.com/package/grunt-contrib-copy
      fonts: {
        cwd: 'assets/fonts',
        src: [ '**' ],
        dest: 'build-dev/fonts',
        expand: true
      },
      fonts_build: {
        cwd: 'assets/fonts',
        src: [ '**' ],
        dest: 'build/fonts',
        expand: true
      },
      img: {
        cwd: 'assets/img',
        src: [ '**' ],
        dest: 'build-dev/img',
        expand: true
      },
      img_build: {
        cwd: 'assets/img',
        src: [ '**' ],
        dest: 'build/img',
        expand: true
      },
      favicon_build: {
        src: 'assets/img/favicon/favicon-grey-32.ico',
        dest: 'build/favicon.ico'
      },
      js: {
        cwd: 'assets/js',
        src: [ '**' ],
        dest: 'build-dev/js',
        expand: true
      },
      offline: {
        cwd: 'assets/js',
        src: ['offline.js'],
        dest: 'build-dev',
        expand: true
      }
    },

    shell: {
      // https://www.npmjs.com/package/grunt-shell
      options: {
        stdout: true,
        stderr: true
      },
      dev: {
        command: 'node server.js build-dev'
      },
      build: {
        command: 'node server.js build'
      }
    },

    fest: {
      // https://www.npmjs.com/package/grunt-fest
      templates: {
        files: [{
          expand: true,
          cwd: 'templates',
          src: '**/*.xml',
          dest: 'assets/js/templates'
        }],
        options: {
          template: function (data) {
            return grunt.template.process(
              'define(function() { return <%= contents %> ; });',
              { data: data }
            );
          }
        }
      }
    },

    watch: {
      // https://www.npmjs.com/package/grunt-contrib-watch
      fest: {
        files: ['templates/**/*.xml'],
        tasks: ['fest', 'copy:js'],
        options: { interrupt: true }
      },
      jade: {
        files: ['layouts/**/*.jade'],
        tasks: ['jade:dev'],
        options: { interrupt: true }
      },
      less: {
        files: ['assets/less/**/*'],
        tasks: ['less:dev', 'postcss:dev'],
        options: { interrupt: true }
      },
      copy_img: {
        files: ['assets/img/**/*'],
        tasks: ['copy:img'],
        options: { interrupt: true }
      },
      copy_js: {
        files: ['assets/js/**/*'],
        tasks: ['copy:js', 'copy:offline'],
        options: { interrupt: true }
      }
    },

    concurrent: {
      // https://www.npmjs.com/package/grunt-concurrent
      dev: {
        tasks: [
          'shell:dev',
          'watch'
        ]
      },
      test: {
        tasks: [
        ]
      },
      options: {
        limit: 2,
        logConcurrentOutput: true
      }
    },

    qunit: {
      // https://www.npmjs.com/package/grunt-contrib-qunit
      options: {
        summaryOnly: true
      },
      all: ['build-dev/test.html']
    }
  });

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-fest');
  grunt.loadNpmTasks('grunt-jade');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-shell');

  grunt.event.on('qunit.moduleStart', function(name) {
    grunt.log.subhead(name);
  });
  grunt.event.on('qunit.testDone', function(name, failed, passed, total) {
    grunt.log.ok(name, '[', passed,  '/', total, ']');
  });

  grunt.registerTask('dev', [
    'fest',
    'less:dev',
    'postcss:dev',
    'jade:dev',
    'copy:img',
    'copy:fonts',
    'copy:js',
    'copy:offline',
    'concurrent:dev'
  ]);
  grunt.registerTask('build', [
    'fest',
    'less:build',
    'postcss:build',
    'jade:build',
    'copy:img_build',
    'copy:favicon_build',
    'copy:fonts_build',
    'uglify:offline_build',
    'requirejs:build',
    'uglify:build'
  ]);
  grunt.registerTask('test', [
    'fest',
    'jade:dev',
    'copy:js',
    'copy:offline',
    'qunit:all'
  ]);
  grunt.registerTask('build-server', ['build', 'shell:build']);
  grunt.registerTask('default', ['build-server']);
};
