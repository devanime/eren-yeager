// ## Globals

var argv = require('minimist')(process.argv.slice(2));
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var webp = require('gulp-webp');
var jshint = require('gulp-jshint');
var lazypipe = require('lazypipe');
var merge = require('merge-stream');
var cssNano = require('gulp-cssnano');
var plumber = require('gulp-plumber');
var rev = require('gulp-rev');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var styleguide = require('sc5-styleguide');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var util = require('util');
var exec = util.promisify(require('child_process').exec);
var rename = require("gulp-rename");
var svgSprite = require('gulp-svg-sprite');
var filter = require('gulp-filter');
var styleguidePath = '../../../styleguide';
// See https://github.com/austinpray/asset-builder
var manifest = require('asset-builder')('./assets/manifest.json');

// `path` - Paths to base asset directories. With trailing slashes.
// - `path.source` - Path to the source files. Default: `assets/`
// - `path.dist` - Path to the build directory. Default: `dist/`
var path = manifest.paths;

// `config` - Store arbitrary configuration values here.
var config = manifest.config || {};

// `globs` - These ultimately end up in their respective `gulp.src`.
// - `globs.js` - Array of asset-builder JS dependency objects. Example:
//   ```
//   {type: 'js', name: 'main.js', globs: []}
//   ```
// - `globs.css` - Array of asset-builder CSS dependency objects. Example:
//   ```
//   {type: 'css', name: 'main.css', globs: []}
//   ```
// - `globs.fonts` - Array of font path globs.
// - `globs.images` - Array of image path globs.
// - `globs.bower` - Array of all the main Bower files.
var globs = manifest.globs;

// `project` - paths to first-party assets.
// - `project.js` - Array of first-party JS assets.
// - `project.css` - Array of first-party CSS assets.
var project = manifest.getProjectGlobs();

// CLI options
var enabled = {
    // Enable static asset revisioning when `--production`
    rev: argv.production,
    // Disable source maps when `--production`
    maps: !argv.production,
    // Fail styles task on error when `--production`
    failStyleTask: argv.production,
    // Fail due to JSHint warnings only when `--production`
    failJSHint: argv.production,
    // Strip debug statements from javascript when `--production`
    stripJSDebug: argv.production,
    // Strip log statements from javascript when `--production` && `--logjs`
    stripJSLog: argv.production && !argv.logjs,
    formatSrc: !argv.production,
    styleguide: argv.styleguide
};

// Path to the compiled assets manifest in the dist directory
var revManifest = path.dist + 'assets.json';

// ## Reusable Pipelines
// See https://github.com/OverZealous/lazypipe

// ### CSS processing pipeline
// Example
// ```
// gulp.src(cssFiles)
//   .pipe(cssTasks('main.css')
//   .pipe(gulp.dest(path.dist + 'styles'))
// ```
var cssTasks = function(filename) {
    return lazypipe()
        .pipe(function() {
            return gulpif(!enabled.failStyleTask, plumber());
        })
        .pipe(function() {
            return gulpif(enabled.maps, sourcemaps.init());
        })
        .pipe(function() {
            return gulpif('*.scss', sass({
                outputStyle: 'nested', // libsass doesn't support expanded yet
                precision: 10,
                includePaths: ['.'],
                errLogToConsole: !enabled.failStyleTask
            }));
        })
        .pipe(concat, filename)
        .pipe(autoprefixer, {
            overrideBrowserslist: [
                'last 6 versions',
                'android 4',
                'opera 12'
            ]
        })
        .pipe(cssNano, {
            safe: true,
            autoprefixer: {remove: false},
            discardComments: {removeAll: true}
        })
        .pipe(function() {
            return gulpif(enabled.rev, rev());
        })
        .pipe(function() {
            return gulpif(enabled.maps, sourcemaps.write('.', {
                sourceRoot: 'assets/styles/'
            }));
        })();
};

// ### JS processing pipeline
// Example
// ```
// gulp.src(jsFiles)
//   .pipe(jsTasks('main.js')
//   .pipe(gulp.dest(path.dist + 'scripts'))
// ```
var jsTasks = function(filename) {
    return lazypipe()
        .pipe(function() {
            return gulpif(enabled.maps, sourcemaps.init());
        })
        .pipe(concat, filename)
        .pipe(uglify, {
            compress: {
                'drop_debugger': enabled.stripJSDebug,
                'drop_console': enabled.stripJSLog
            }
        })
        .pipe(function() {
            return gulpif(enabled.rev, rev());
        })
        .pipe(function() {
            return gulpif(enabled.maps, sourcemaps.write('.', {
                sourceRoot: 'assets/scripts/'
            }));
        })();
};

// ### Write to rev manifest
// If there are any revved files then write them to the rev manifest.
// See https://github.com/sindresorhus/gulp-rev
var writeToManifest = function(directory) {
    return lazypipe()
        .pipe(gulp.dest, path.dist + directory)
        .pipe(browserSync.stream, {match: '**/*.{js,css}'})
        .pipe(rev.manifest, revManifest, {
            base: path.dist,
            merge: true
        })
        .pipe(gulp.dest, path.dist)();
};

// ## Gulp tasks
// Run `gulp -T` for a task summary

// ### Styles
// `gulp styles` - Compiles, combines, and optimizes Bower CSS and project CSS.
// By default this task will only log a warning if a precompiler error is
// raised. If the `--production` flag is set: this task will fail outright.
gulp.task('styles', ['wiredep'], function() {
    var merged = merge();
    manifest.forEachDependency('css', function(dep) {
        var cssTasksInstance = cssTasks(dep.name);
        if (!enabled.failStyleTask) {
            cssTasksInstance.on('error', function(err) {
                console.error(err.message);
                this.emit('end');
            });
        }
        merged.add(gulp.src(dep.globs, {base: 'styles'})
            .pipe(cssTasksInstance));
    });
    return merged
        .pipe(writeToManifest('styles'));
});

// ### Scripts
// `gulp scripts` - Runs JSHint then compiles, combines, and optimizes Bower JS
// and project JS.
gulp.task('scripts', ['jshint'], function() {
    var merged = merge();
    manifest.forEachDependency('js', function(dep) {
        merged.add(
            gulp.src(dep.globs, {base: 'scripts'})
                .pipe(jsTasks(dep.name))
        );
    });
    return merged
        .pipe(writeToManifest('scripts'));
});

// ### Fonts
// `gulp fonts` - Grabs all the fonts and outputs them in a flattened directory
// structure. See: https://github.com/armed/gulp-flatten
gulp.task('fonts', function() {
    return gulp.src(globs.fonts)
        // .pipe(flatten())
        .pipe(gulp.dest(path.dist + 'fonts'))
        .pipe(browserSync.stream());
});

var svgList = {};
gulp.task('buildSvgList', function(){
    var buildList = filter(function(vinylObj) {
        var basename = vinylObj.path.split('/').pop();
        svgList[basename] = vinylObj.path;
        return true;
    });
    return gulp.src(globs.images)
        .pipe(filter('**/svg-sprite/**/*.svg'))
        .pipe(buildList)
});
gulp.task('svgSprite', ['buildSvgList'], function() {
    var filterUnique = filter(function(vinylObj) {
        var basename = vinylObj.path.split('/').pop();
        return svgList[basename] === vinylObj.path;
    });
    return gulp.src(globs.images)
        .pipe(filter('**/svg-sprite/**/*.svg'))
        .pipe(filterUnique)
        .pipe(svgSprite({
            mode: {
                symbol: {
                    inline: true,
                    dest: "./",
                    sprite: path.dist + 'images/sprite.svg'
                }
            },
            svg: {
                namespaceClassnames: false
            },
            shape: {
                id: {
                    separator: ''
                }
            }
        }))
        .pipe(gulp.dest('./'));
});

// ### Images
// `gulp images` - Run lossless compression on all the images.
gulp.task('images', ['svgSprite'], function() {
    return gulp.src(globs.images)
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{removeUnknownsAndDefaults: false}, {cleanupIDs: false}]
        }))
        .pipe(gulp.dest(path.dist + 'images'))
        // .pipe(rename(function (path) {
        //     path.extname += '.webp';
        // }))
        // .pipe(webp())
        // .pipe(gulp.dest(path.dist + 'images'))
        .pipe(browserSync.stream());
});
// ### WebP
gulp.task('images:webp', ['images'], function() {
    return gulp.src(path.dist + 'images/**/*.{png,jpg}')
        .pipe(rename(function (path) {
            path.extname += '.webp';
        }))
        .pipe(webp())
        .pipe(gulp.dest(path.dist + 'images'));
});

// ### JSHint
// `gulp jshint` - Lints configuration JSON and project JS.
gulp.task('jshint', function() {
    return gulp.src([
        'bower.json', 'gulpfile.js'
    ].concat(project.js))
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(gulpif(enabled.failJSHint, jshint.reporter('fail')));
});

gulp.task('estarossa', function() {
    return exec('(cd ../../plugins/estarossa && make) && rm -rf bower_components/estarossa* && bower install');
});

gulp.task('estarossa-scripts', ['estarossa'], function(callback) {
    runSequence('scripts', callback);
});
gulp.task('estarossa-styles', ['estarossa'], function(callback) {
    runSequence('styles', callback);
});

gulp.task('vc-library', function() {
    return exec('(cd ../../plugins/vc-library && make) && rm -rf bower_components/vc-library* && bower install');
});

gulp.task('vc-library-scripts', ['vc-library'], function(callback) {
    runSequence('scripts', callback);
});

gulp.task('vc-library-styles', ['vc-library'], function(callback) {
    runSequence('styles', callback);
});

gulp.task('dio-brando', function() {
    return exec('rm -rf bower_components/dio-brando* && bower install');
});

gulp.task('dio-brando-scripts', ['dio-brando'], function(callback) {
    runSequence('scripts', callback);
});

gulp.task('dio-brando-styles', ['dio-brando'], function(callback) {
    runSequence('styles', callback);
});

// ### SC5-Styleguide
// `gulp styleguide` - Makes a styleguide from SASS files
gulp.task('styleguide:generate', function() {
    return gulp.src([
        'assets/styles/**/*.scss',
        'bower_components/estarossa.*/scss/*.scss',
        '../../plugins/ticket-calendar/assets/styles/main/**/*.scss'
    ])
        .pipe(styleguide.generate({
            title: 'Skeleton Styleguide',
            server: false,
            rootPath: styleguidePath,
            appRoot: '/styleguide',
            readOnly: true,
            overviewPath: 'STYLEGUIDE.md',
            includeDefaultStyles: true
        }))
        .pipe(gulp.dest(styleguidePath));
});

gulp.task('styleguide:applystyles', function() {
    return gulp.src([
        'assets/styles/misc/styleguide.scss',
        'bower_components/estarossa.common/scss/styleguide.scss',
        '../../plugins/ticket-calendar/dist/styles/styleguide.css'
    ])
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(styleguide.applyStyles())
        .pipe(gulp.dest(styleguidePath));
});

gulp.task('styleguide:images', function() {
    return gulp.src(['dist/images/**/*'])
        .pipe(gulp.dest(styleguidePath + '/images'));
});

gulp.task('styleguide:fonts', function() {
    return gulp.src(['dist/fonts/**/*'])
        .pipe(gulp.dest(styleguidePath + '/fonts'));
});

// ### Clean
// `gulp clean` - Deletes the build folder entirely.
gulp.task('clean', require('del').bind(null, [path.dist, styleguidePath], {force: true}));

// ### Watch
// `gulp watch` - Use BrowserSync to proxy your dev server and synchronize code
// changes across devices. Specify the hostname of your dev server at
// `manifest.config.devUrl`. When a modification is made to an asset, run the
// build step for that asset and inject the changes into the page.
// See: http://www.browsersync.io
gulp.task('watch', function() {
    browserSync.init({
        files: ['{lib,templates}/**/*.php', '*.php'],
        proxy: config.devUrl,
        snippetOptions: {
            whitelist: ['/wp-admin/admin-ajax.php'],
            blacklist: ['/wp-admin/**']
        }
    });
    gulp.watch([path.source + 'styles/**/*'], ['styles', 'styleguide']);
    gulp.watch([path.source + 'scripts/**/*'], ['jshint', 'scripts']);
    gulp.watch([path.source + 'fonts/**/*'], ['fonts']);
    gulp.watch([path.source + 'images/**/*'], ['images']);
    gulp.watch(['bower.json', 'assets/manifest.json'], ['build']);
    gulp.watch(['../../plugins/estarossa/**/*.js', '!../../plugins/estarossa/**/dist/**/*.js'], ['estarossa-scripts']);
    gulp.watch(['../../plugins/estarossa/**/*.scss'], ['estarossa-styles']);
    gulp.watch(['../../plugins/vc-library/assets/js/**/*.js'], ['vc-library-scripts']);
    gulp.watch(['../../plugins/vc-library/assets/scss/**/*.scss'], ['vc-library-styles']);
    gulp.watch(['../dio-brando/assets/scripts/**/*.js'], ['dio-brando-scripts']);
    gulp.watch(['../dio-brando/assets/styles/**/*.scss'], ['dio-brando-styles']);
});

// ### Build
// `gulp build` - Run all the build tasks but don't clean up beforehand.
// Generally you should be running `gulp` instead of `gulp build`.
gulp.task('build', function(callback) {
    runSequence('styles',
        'scripts',
        ['fonts', 'images:webp'],
        'styleguide',
        callback);
});

gulp.task('styleguide', function(callback) {
    if (enabled.styleguide) {
        runSequence(
            'styleguide:generate',
            'styleguide:applystyles',
            'styleguide:images',
            'styleguide:fonts',
            callback);
    } else {
        callback();
    }
});

// ### Wiredep
// `gulp wiredep` - Automatically inject Less and Sass Bower dependencies. See
// https://github.com/taptapship/wiredep
gulp.task('wiredep', function() {
    var wiredep = require('wiredep').stream;
    return gulp.src(project.css)
        .pipe(wiredep())
        .pipe(changed(path.source + 'styles', {
            hasChanged: changed.compareSha1Digest
        }))
        .pipe(gulp.dest(path.source + 'styles'));
});

// ### Gulp
// `gulp` - Run a complete build. To compile for production run `gulp --production`.
gulp.task('default', ['clean'], function(callback) {
    runSequence('build', callback);
});

module.exports = gulp.tasks;
