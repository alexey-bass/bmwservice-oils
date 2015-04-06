/* global module */

module.exports = function(grunt) {

    grunt.initConfig({
        
        package: grunt.file.readJSON('package.json'),
        
        copyright: 
            '/**\n' +
            ' * <%= package.name %> v<%= package.version %>\n' +
            ' * Copyright 2013-<%= grunt.template.today("yyyy") %> Alexey Bass.\n' +
            ' */\n',
            
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
        
        htmlmin: {
            index: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'index.html': 'index.src.html'
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
                    'db.min.json': 'db.json'
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
                    'css/combined.min.css': [
                        'css/normalize-1.1.3.css',
                        'css/main.css'
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
                    'js/main.min.js': 'js/main.js'
                }
            }
        },
        
        'string-replace': {
            index: {
                files: {
                    'main.src.html': 'main.src.html'
                },
                options: {
                    replacements: [{
                        pattern: /([csj]{2,3})\?[0-9]{6}/ig,
                        replacement: '$1?<%= grunt.template.today("yymmdd") %>'
                    }]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-jsonmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');    

    grunt.registerTask('default', ['build']);
    grunt.registerTask('build',   ['string-replace', 'htmlmin', 'jsonmin', 'cssmin', 'uglify']);
};
