/**
 * Created by yzl on 2017/6/21.
 */
// 添加引用
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var nodemon = require('gulp-nodemon');
var gulp= require('gulp');
// var babel = require('gulp-babel');

//express启动
gulp.task("node", function() {
    nodemon({
        script: './bin/www',
        ext: 'js html',
        env: {
            'NODE_ENV': 'development'
        }
    })
});

// //babel转码
// gulp.task('convertBabel', function() {
//     console.log("convert");
//     return gulp.src('./public/javascripts/sysGraph/*.js')
//         .pipe(babel({
//             presets: ['es2015']
//         }))
//         .pipe(gulp.dest('./public/javascripts/es5js/'));
// });

gulp.task('server', ["node"], function() {
    var files = [
        'views/**/*.html',
        'views/**/*.ejs',
        'views/**/*.jade',
        'public/**/*.*'
    ];
    var jsfiles=[
        'public/**/*.js'
    ]
    browserSync.init(files, {
        proxy: 'http://localhost:3000',
        browser: 'chrome',
        notify: false,
        port: 4001
    });
    gulp.watch(files).on("change",reload);
    // gulp.watch(jsfiles,['convertBabel']);
});




