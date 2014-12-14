module.exports = function(grunt) {

  grunt.initConfig({
	pkg : grunt.file.readJSON('package.json'),
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
            'app/styles/app.css': 'app/styles/scss/app.scss',
            'app/styles/login.css': 'app/styles/scss/login.scss',
            'app/styles/chat.css': 'app/styles/scss/chat.scss',
          }
        }
      },
      concat: {
        // Setup concat of the components some day
        // components: {
        //   src: ['app/scripts/directives/directives.header', 'app/scripts/directives/*.js'],
        //   dest: 'app/scripts/directives.js'
        // },
        css: {
          src: ['app/styles/app.css'],
          dest: 'app/styles/app.css'
        }
      },
      nggettext_extract: {
          pot: {
              files: {
                  'app/po/template.pot': ['app/*.html', 'app/*/*.html']
              }
          },
      },
      nggettext_compile: {
          all: {
              files: {
                  'app/translations.js': ['app/po/*.po']
              }
          },
      },
      watch: {
        options: {
          livereload: true,
        },
        html: {
          files: ['app/index.html', 'app/*/*.html'],
          tasks: ['nggettext_extract', 'notify:watchHTML']
        },
        sass: {
          options: {
            livereload: false
          },
          files: ['app/styles/scss/*.scss'],
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
                  "app/scripts/controllers.js"
                ],
              },
              {
                id: "services",
                title: "Services",
                showSource: true,
                scripts: [
                  "app/scripts/services.js"
                ],
              },
              {
                id: "directives",
                title: "Dircetives",
                showSource: true,
                scripts: [
                  "app/scripts/directives.js"
                ],
              },
              {
                id: "filters",
                title: "Filters",
                showSource: true,
                scripts: [
                  "app/scripts/filters.js"
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

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-docular');
    grunt.loadNpmTasks('grunt-notify');

    grunt.task.run('notify_hooks');

    grunt.registerTask('default', [
      'nggettext_extract', 
      'nggettext_compile', 
      'sass', 
      'concat', 
      'watch']);
};