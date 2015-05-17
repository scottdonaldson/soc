var gulp = require('gulp'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer-core'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    awspublish = require('gulp-awspublish'),
    browserSync = require('browser-sync').create();
var reload = browserSync.reload;

// ----- Config
var jsPrefix = 'app/js/src/';

var paths = {
    cssIn: 'app/scss/**/*.scss',
    cssOut: 'app/css/',
    jsIn: ['utils', 'templates', 'init', 'script'],
    jsOut: 'app/js/min',
    html: ['app/index.html', 'app/game.html']
};
paths.jsIn.forEach(function(path, i) {
    paths.jsIn[i] = jsPrefix + path + '.js';
});

gulp.task('css', function() {

    var processors = [
        require('autoprefixer-core')('last 2 versions')
    ];

    gulp.src( paths.cssIn )
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        //.pipe(gulp.dest( paths.cssOut ))
        .pipe(postcss(processors))
        .pipe(gulp.dest( paths.cssOut ))
        .pipe(reload({ stream: true }));

});

gulp.task('game', function() {
    gulp.src(['app/js/src/gamehelpers.js', 'app/js/src/game.js'])
        //.pipe(uglify())
        .pipe(gulp.dest('app/js/min'));
});

gulp.task('js', function() {

    gulp.src( paths.jsIn )
        //.pipe(uglify())
        .pipe(concat('script.js'))
        .pipe(gulp.dest( paths.jsOut ));
});

gulp.task('publish', function() {

    // TODO
    /* var publisher = awspublish.create({
        params: {
            Bucket: '...'
        }
    }); */

});

gulp.task('serve', ['css', 'js'], function() {

    browserSync.init({
        server: {
            baseDir: './app'
        }
    });

    gulp.watch( paths.cssIn, ['css'] );
    gulp.watch( paths.jsIn, ['js'] ).on('change', reload);

    // game
    gulp.watch( ['app/js/src/gamehelpers.js', 'app/js/src/game.js'], ['game'] ).on('change', reload);

    gulp.watch( paths.html ).on('change', reload);


});

gulp.task('default', ['serve']);
