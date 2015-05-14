var gulp = require('gulp'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer-core'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    awspublish = require('gulp-awspublish');

// ----- Config
var paths = {
    cssIn: 'app/scss/style.scss',
    cssOut: 'app/css',
    jsIn: 'app/js/src/**/*.js',
    jsOut: 'app/js/min'
};

gulp.task('css', function() {

    var processors = [
        require('autoprefixer-core')('last 2 versions')
    ];

    gulp.src( paths.cssIn )
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .pipe(gulp.dest( paths.cssOut ))
        .pipe(postcss(processors))
        .pipe(gulp.dest( paths.cssOut ));

});

gulp.task('js', function() {

    gulp.src( paths.jsIn )
        //.pipe(uglify())
        .pipe(concat('script.js'))
        .pipe(gulp.dest( paths.jsOut ));
});

gulp.task('watch', function() {

    gulp.watch( paths.cssIn, ['css'] );
    gulp.watch( paths.jsIn, ['js'] );

});

gulp.task('publish', function() {

    // TODO
    /* var publisher = awspublish.create({
        params: {
            Bucket: '...'
        }
    }); */

});

gulp.task('default', ['css', 'js', 'watch']);
