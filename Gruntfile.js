module.exports = function(grunt) {

    grunt.initConfig({

        package: grunt.file.readJSON('package.json'),

        copyright:
            '/**\n' +
            ' * <%= package.name %> v<%= package.version %>\n' +
            ' * Copyright 2013-<%= grunt.template.today("yyyy") %> Alexey Bass.\n' +
            ' */\n',

        clean: ['build'],

        mkdir: {
            all: {
                options: {
                    mode: 0777,
                    create: ['build']
                },
            },
        },

        jshint: {
            options: {
                laxcomma: true,
                laxbreak: true,
                sub: true // ['blabla'] is better written in dot notation.
            },
            js: {
                src: ['js/main.js'],
                options: {
                    '-W008': true // ^ A leading decimal point can be confused with a dot
                }
            }
        },

        jsonmin: {
            db: {
                options: {
                    stripWhitespace: true,
                    stripComments: true
                },
                files: {
                    'build/db.min.json': 'src/db.json'
                }
            }
        },

        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'build/styles.min.css': [
                        'src/css/normalize-1.1.3.css',
                        'src/css/main.css'
                    ]
                }
            }
        },

        uglify: {
            options: {
                preserveComments: 'some' // @preserve @license @cc_on
            },
            js: {
                files: {
                    'build/scripts.min.js': 'src/js/scripts.js'
                }
            }
        },

        'string-replace': {
            index: {
                files: {
                    'build/index.html': 'src/index.html'
                },
                options: {
                    replacements: [{
                        pattern: /([csj]{2,3})\?[0-9]{6}/ig,
                        replacement: '$1?<%= grunt.template.today("yymmdd") %>'
                    }]
                }
            }
        },

        htmlmin: {
            index: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'build/index.html': 'build/index.html'
                }
            }
        },

        filesize: {
            base: {
                files: [
                    {expand: true, cwd: 'build', src: ['*']}
                ],
                options: {
                    ouput: [
                        {
                            stdout: true
                        }
                    ]
                }
            }
        }
    });

    grunt.registerTask('test', 'Log some stuff.', function() {
        grunt.log.write('Logging some stuff...').ok();
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-jsonmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-filesize');

    grunt.registerTask('default', ['build']);
    // grunt.registerTask('build',   ['string-replace', 'htmlmin', 'jsonmin', 'cssmin', 'uglify']);
    grunt.registerTask('build',   [
        'clean', 'mkdir',
        'string-replace', 'htmlmin',
        'cssmin', 'uglify',
        'jsonmin',
        'filesize'
    ]);
};
