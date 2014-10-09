/* global require */

'use strict';

// include gulp
var gulp = require('gulp');

// include plug-ins
var   del = require('del'),
      jshint = require('gulp-jshint'),
      connect = require('gulp-connect'),
      stylus = require('gulp-stylus'),
      nib = require('nib'),
      stripDebug = require('gulp-strip-debug'),
      uglify = require('gulp-uglify'),
      autoprefixer = require('gulp-autoprefixer'),
      minifyCSS = require('gulp-minify-css'),
      inject = require('gulp-inject'),
      wiredep = require('wiredep').stream,
      gulpif = require('gulp-if'),
      useref = require('gulp-useref');

/* Common tasks */

// JS hint task
gulp.task('jshint', function() {
  gulp.src(['./src/scripts/*.js','./gulpfile.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

// Preprocesa archivos Stylus a CSS y recarga los cambios
gulp.task('stylus', function() {
  gulp.src('./src/styles/*.styl')
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest('./src/styles'))
    .pipe(connect.reload());
});

// Preprocesa archivos CSS para añadirles el soporte a varios navegadores
gulp.task('css', function() {
  gulp.src('./src/styles/*.css')
    .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: true,
    }))
    .pipe(gulp.dest('./src/styles'));
});

/* Development tasks */

// Development server

gulp.task('server', function() {
  connect.server({
    root: './src',
    hostname: '0.0.0.0',
    port: 8080,
    livereload: true
   });
});

// Recarga el navegador cuando hay cambios en el HTML
gulp.task('html', function() {
  gulp.src('./src/**/*.html')
    .pipe(connect.reload());
});

// Busca en las carpetas de estilos y javascript los archivos
// para inyectarlos en el index.html
gulp.task('inject', function() {
  return gulp.src('index.html', {cwd: './src'})
    .pipe(inject(
      gulp.src(['./src/scripts/**/*.js']), {
      read: false,
      ignorePath: '/src'
    }))
    .pipe(inject(
      gulp.src(['./src/styles/**/*.css']), {
        read: false,
        ignorePath: '/src'
      }
    ))
    .pipe(gulp.dest('./src'));
});

// Inyecta las librerias que instalemos vía Bower
gulp.task('wiredep', function () {
  gulp.src('./src/index.html')
    .pipe(wiredep({
      directory: './src/lib'
    }))
    .pipe(gulp.dest('./src'));
});

// Watch task
gulp.task('watch', function() {
  // watch for HTML changes
  gulp.watch(['./src/*.html'],['html']);
  // watch for JS changes
  gulp.watch(['./src/scripts/*.js'],['inject']);
  // watch for CSS changes
  gulp.watch(['./src/styles/*.styl'],['stylus']);
  // watch for CSS changes
  gulp.watch(['./src/styles/*.css'],['css','inject']);
  // watch bower
  gulp.watch(['./bower.json'], ['wiredep']);
});

/* Default task */
gulp.task('default', ['server', 'watch']);


/* Build tasks */

gulp.task('clean', function (cb) {
  del([
    'build'
    // we don't want to clean this file though so we negate the pattern
    //'!build/mobile/deploy.json'
  ], cb);
});

gulp.task('compress', function() {
  gulp.src('./src/index.html')
    .pipe(useref.assets())
    .pipe(gulpif('*.js',  uglify({mangle: false })))
    .pipe(gulpif('*.js',  stripDebug()))
    .pipe(gulpif('*.css', minifyCSS()))
    .pipe(gulp.dest('./build'));
});

gulp.task('copy', function() {
  gulp.src('./src/index.html')
    .pipe(useref())
    .pipe(gulp.dest('./build'));
  gulp.src(['./src/data/**/*','./src/images/**/*'],{base:'./src'})
    .pipe(gulp.dest('./build'));
});

// Build server

gulp.task('server-dist', function() {
  connect.server({
    root: './build',
    hostname: '0.0.0.0',
    port: 8080,
    livereload: true
  });
});

gulp.task('build', [
  //'clean',
  //'jshint',
  'stylus',
  'css',
  'copy',
  'compress'
  //'server-dist'
]);

