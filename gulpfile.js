var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var babel = require("gulp-babel");
var sourcemaps = require('gulp-sourcemaps');
var path = require('path');
var peg = require('gulp-peg');

var babelOptions = {
  // http://babeljs.io/docs/usage/experimental/
  stage: 1,

  // http://babeljs.io/docs/usage/runtime/
  optional: ['runtime'],

  // http://babeljs.io/docs/advanced/transformers/#optional
  //whitelist: [],

  blacklist: []
};

var pegOptions = {
};

var paths = {
  sourceRoot: path.join(__dirname, 'src'),
  src: ['src/**/*.js'],
  dist: 'dist',
  test: 'dist/test/**/*.js',
  peg: ['src/**/*.peg']
}

gulp.task('default', ['mocha', 'watch']);

gulp.task('babel', function () {
  return gulp.src(paths.src)
      .pipe(sourcemaps.init())
      .pipe(babel(babelOptions))
      .pipe(sourcemaps.write('.', { sourceRoot: paths.sourceRoot }))
      .pipe(gulp.dest(paths.dist));
});

gulp.task('dist', ['babel'], function() {
  return gulp.src(['src/**/*', '!**/*.js'], {base: 'src'})
    .pipe(gulp.dest(paths.dist));
});

gulp.task('mocha', ['dist'], function() {
  return gulp.src(paths.test, {read: false})
    .pipe(mocha({ reporter: 'spec' }))
    ; //.on('error', gutil.log);
});

gulp.task('peg', function() {
  return gulp.src(paths.peg)
    .pipe(peg(pegOptions)) //.on('error', gutil.log))
    .pipe(gulp.dest(paths.dist))
});

gulp.task('watch', function () {
  gulp.watch(paths.src, ['mocha']);
});

