module.exports = function(grunt) {

  grunt.initConfig({
	pkg : grunt.file.readJSON('package.json'),
      
      concurrent: {
        target: {
          tasks: ['shell:run_mongod', 'nodemon', 'sass', 'concat', 'watch'],
          options: {
            logConcurrentOutput: true
          }
        }
      },

      nodemon: {
        dev: {
          script: 'server.js'
        }
      },

      shell: {
        run_mongod: {
            command: function () {
                return 'mongod';
            }
        }
      },
      connect: {
        server: {
          options: {},
        }
      },
      sass: {
        dist: {
          options: {
            style: 'compressed'
          },
          files: {
            'public/styles/app.css': 'public/styles/scss/app.scss',
            'public/styles/login.css': 'public/styles/scss/login.scss',
            'public/styles/chat.css': 'public/styles/scss/chat.scss',
          }
        }
      },
      concat: {
        // Setup concat of the components some day
        // components: {
        //   src: ['public/scripts/directives/directives.header', 'public/scripts/directives/*.js'],
        //   dest: 'public/scripts/directives.js'
        // },
        css: {
          src: ['public/styles/app.css'],
          dest: 'public/styles/app.css'
        }
      },
      nggettext_extract: {
          pot: {
              files: {
                  'public/po/template.pot': ['public/*.html', 'public/*/*.html']
              }
          },
      },
      nggettext_compile: {
          all: {
              files: {
                  'public/translations.js': ['public/po/*.po']
              }
          },
      },
      watch: {
        options: {
          livereload: true,
        },
        html: {
          files: ['public/index.html', 'publoc/*/*.html'],
          tasks: ['nggettext_extract', 'notify:watchHTML']
        },
        sass: {
          options: {
            livereload: false
          },
          files: ['public/styles/scss/*.scss'],
          tasks: ['sass', 'concat:css', 'notify:watchSASS'],
        },
        css: {
          files: [],
          tasks: ['-']
        }
        // Watch js for concatenations
      },
      docular: {
        docular_webapp_target: "docs",
        showDocularDocs: true,
        showAngularDocs: false,
        groups: [
          {
            groupId: "roomico",
            groupTitle: "Roomico",
            groupIcon: "icon-book",
            showSource: true,
            sections: [
              {
                id: "controllers",
                title: "Controllers",
                showSource: true,
                scripts: [
                  "public/scripts/controllers.js"
                ],
              },
              {
                id: "services",
                title: "Services",
                showSource: true,
                scripts: [
                  "public/scripts/services.js"
                ],
              },
              {
                id: "directives",
                title: "Dircetives",
                showSource: true,
                scripts: [
                  "public/scripts/directives.js"
                ],
              },
              {
                id: "filters",
                title: "Filters",
                showSource: true,
                scripts: [
                  "public/scripts/filters.js"
                ],
              }
            ]
          }
        ]
      },

      notify_hooks: {
        options: {
          enabled: true,
          max_jshint_notifications: 5, // maximum number of notifications from jshint output
          title: "Clutterboard", // defaults to the name in package.json, or will use project directory's name
          success: false, // whether successful grunt executions should be notified automatically
          duration: 1 // the duration of notification in seconds, for `notify-send only
        }
      },

      notify: {
        watchHTML: {
          options: {
            title: 'HTML partials changed', 
            message: 'Gettext finished.',
          }
        },
        watchSASS: {
          options: {
            title: 'SASS changed', 
            message: 'Complie finished.',
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-docular');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.task.run('notify_hooks');

    grunt.registerTask('default', ['concurrent:target']);

    grunt.registerTask('old', [
      'nggettext_extract', 
      'nggettext_compile', 
      'sass', 
      'concat', 
      'watch']);

    grunt.registerTask('mongo', ['shell:run_mongod']);
};