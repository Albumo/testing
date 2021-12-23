var fs = require('fs');
const gulp = require('gulp');
const pug = require('gulp-pug');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');
var pngquant = require('imagemin-pngquant');
const csso = require('gulp-csso');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
const browsersync = require('browser-sync');
const del = require('del');
const foreach = require('gulp-foreach');
const svgo = require('gulp-svgo');
const babel = require('gulp-babel');
const sassLint = require('gulp-sass-lint');
const gulpsync = require('gulp-sync')(gulp);
const svgSprite = require('gulp-svg-sprite');
const cheerio = require('gulp-cheerio');
const pugLinter = require('gulp-pug-linter');
const pugLintStylish = require('puglint-stylish');
const eslint = require('gulp-eslint');

const skinConfig = require('./skinConfig.json'); // конфиг скина
const componentsConfig = require('./componentsConfig.json'); // конфиг компонентов

const nameCSSfile = 'main'; // название файла стилей на выходе
const src_path = {
    components: 'markup/components/',
    pages_src: `markup/pages-src/${skinConfig.number}/`,
    pages: `markup/pages/`,
    scss: 'markup/static/scss/',
    img: 'markup/static/img/',
    js: 'markup/static/js/',
    fonts: 'markup/static/fonts/'
};

const dev_path = {
    css: 'dev/static/css/',
    js: 'dev/static/js/',
    fonts: 'dev/static/fonts/',
    pages: 'dev/',
    img: 'dev/static/img/general/',
    imgContent: 'dev/static/img/content/'
};

const build_path = {
    css: `build_${skinConfig.number}_${skinConfig.theme}/static/css/`,
    js: `build_${skinConfig.number}_${skinConfig.theme}/static/js/`,
    fonts: `build_${skinConfig.number}_${skinConfig.theme}/static/fonts/`,
    pages: `build_${skinConfig.number}_${skinConfig.theme}/`,
    img: `build_${skinConfig.number}_${skinConfig.theme}/static/img/general/`,
    imgContent: `build_${skinConfig.number}_${skinConfig.theme}/static/img/content/`
};

let current_skin = '';
let current_skin_path = {};
let current_theme = '';

gulp.task('clean', function () {
    del.sync('markup/pages/*');
});
gulp.task('clean-dev', function () {
    del.sync('dev');
});


// ****************************** REPLACE PLACEHOLDER PUG ****************************** //

gulp.task('replacePlaceholder', function () {
    const files = fs.readdirSync(src_path.pages_src, 'utf8');

    files.forEach(function (item, i, arr) {
        var contentFile = fs.readFileSync(src_path.pages_src + item, 'utf8');

        for (key in componentsConfig) {
            var st = '%=' + key + '=%',
                re = st,
                str = contentFile,
                newstr = str.replace(re, componentsConfig[key].number);
            fs.writeFileSync(src_path.pages + item, newstr, 'utf8');
            contentFile = newstr;
        }
    });


});

// ****************************** REPLACE PLACEHOLDER PUG ****************************** //


// ****************************** CSS ****************************** //

gulp.task('sass-lint', function () {
    return gulp.src('**/*.scss')
        .pipe(sassLint({
            configFile: '.sass-lint.yml'
        }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
});

gulp.task('sass-dev', function () {
    var listSCSS = [
        src_path.scss + 'normalize.scss',
        src_path.scss + 'mixins.scss',
        src_path.scss + 'vars.scss',
        src_path.scss + 'common.scss',
        src_path.scss + 'plugins.scss',
        src_path.scss + 'themes/' + skinConfig.theme + '.scss',
        src_path.scss + 'skins/' + skinConfig.number + '/skin.scss'
    ];
    for (key in componentsConfig) {
        listSCSS.push(src_path.components + componentsConfig[key].number + '/' + componentsConfig[key].name + '/*.scss')
    }
    gulp.src(listSCSS)
        .pipe(autoprefixer())
        .pipe(concat(nameCSSfile + '.scss'))
        .pipe(sourcemaps.init())  // Process the original sources
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write()) // Add the map to modified source.
        .pipe(gulp.dest(dev_path.css))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(dev_path.css))
        .pipe(browsersync.reload({stream: true}));
});

gulp.task('sass-build', function () {
    var listSCSS = [
        src_path.scss + 'normalize.scss',
        src_path.scss + 'mixins.scss',
        src_path.scss + 'vars.scss',
        src_path.scss + 'common.scss',
        src_path.scss + 'plugins.scss',
        src_path.scss + 'themes/' + skinConfig.theme + '.scss',
        src_path.scss + 'skins/' + skinConfig.number + '/skin.scss'
    ];
    for (key in componentsConfig) {
        listSCSS.push(src_path.components + componentsConfig[key].number + '/' + componentsConfig[key].name + '/*.scss')
    }
    gulp.src(listSCSS)
        .pipe(autoprefixer())
        .pipe(concat(nameCSSfile + '.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(build_path.css))
        .pipe(csso())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(build_path.css))
});


// ****************************** CSS ****************************** //


// ****************************** PUG ****************************** //

gulp.task('pug-lint', function () {
    return gulp.src('**/*.pug')
        .pipe(pugLinter({
            reporter: pugLintStylish,
            failAfterError: true
        }))
});

gulp.task('pug-dev', function () {
    gulp.src([
        src_path.pages + '*.pug',
        '!' + src_path.pages + '_*.pug'
    ])
        .pipe(pug({pretty: true}))
        .on('error', console.log)
        .pipe(gulp.dest(dev_path.pages))
        .pipe(browsersync.reload({stream: true}));
});

gulp.task('pug-build', function () {
    gulp.src([
        src_path.pages + '*.pug',
        '!' + src_path.pages + '_*.pug'
    ])
        .pipe(pug({pretty: true}))
        .on('error', console.log)
        .pipe(gulp.dest(build_path.pages))
});

// ****************************** PUG ****************************** //


// ****************************** IMAGES ****************************** //

gulp.task('svg', function () {
    return gulp.src([src_path.img + skinConfig.number + '/content/*'])
        .pipe(svgo())

        .pipe(gulp.dest(function (file) {
            return file.base;
        }));
});

gulp.task('images-general-dev', function () {
    var listSCSS = [
        src_path.img + skinConfig.number + '/general/*.+(webp|png|jpg|svg|gif)',
        src_path.img + skinConfig.number + '/general/' + skinConfig.theme + '/*.+(webp|png|jpg|svg|gif)'
    ];
    for (key in componentsConfig) {
        listSCSS.push(src_path.components + componentsConfig[key].number + '/' + componentsConfig[key].name + '/img/*.+(webp|png|jpg|svg|gif)');
        listSCSS.push(src_path.components + componentsConfig[key].number + '/' + componentsConfig[key].name + '/img/' + skinConfig.theme + '/*.+(webp|png|jpg|svg|gif)')
    }
    gulp.src(listSCSS)
        .pipe(changed(dev_path.img))
        .pipe(gulp.dest(dev_path.img))
        .pipe(browsersync.reload({stream: true}));
});

gulp.task('images-content-dev', function () {
    gulp.src([src_path.img + skinConfig.number + '/content/*'])
        .pipe(changed(dev_path.imgContent))
        .pipe(gulp.dest(dev_path.imgContent))
        .pipe(browsersync.reload({stream: true}));
});

// svg-sprite DEV
gulp.task('images-svgSprite-dev', function () {
    var listSCSS = [
        src_path.img + skinConfig.number + '/svg/*.svg',
        src_path.img + skinConfig.number + '/svg/' + skinConfig.theme + '/*.svg'
    ];

    gulp.src(listSCSS)
        .pipe(changed(dev_path.img))
        .pipe(svgSprite({
                mode: {
                    stack: {
                        sprite: '../sprite.svg'  //sprite file name
                    }
                }
            }
        ))
        .pipe(cheerio({
            run: function ($) {
                $.root().children().first().removeAttr('viewBox');
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        .pipe(gulp.dest(dev_path.img))
        .pipe(browsersync.reload({stream: true}));
});
// svg-sprite DEV end


gulp.task('images-general-build', function () {
    var listSCSS = [
        src_path.img + skinConfig.number + '/general/*.+(webp|png|jpg|svg|gif)',
        src_path.img + skinConfig.number + '/general/' + skinConfig.theme + '/*.+(webp|png|jpg|svg|gif)'
    ];
    for (key in componentsConfig) {
        listSCSS.push(src_path.components + componentsConfig[key].number + '/' + componentsConfig[key].name + '/img/*.+(webp|png|jpg|svg|gif)');
        listSCSS.push(src_path.components + componentsConfig[key].number + '/' + componentsConfig[key].name + '/img/' + skinConfig.theme + '/*.+(webp|png|jpg|svg|gif)')
    }
    gulp.src(listSCSS)
        .pipe(changed(build_path.imgContent))
        .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.jpegtran({progressive: true}),
                imageminJpegRecompress({
                    loops: 5,
                    min: 80,
                    max: 90,
                    quality: 'veryhigh'
                }),
                imagemin.svgo(),
                imagemin.optipng({optimizationLevel: 3}),
                pngquant({quality: [0.8, 0.9], speed: 3})
            ], {
                verbose: true
            })
        )
        .pipe(gulp.dest(build_path.img))
});

gulp.task('images-content-build', function () {
    gulp.src([src_path.img + skinConfig.number + '/content/*'])
        .pipe(changed(build_path.imgContent))
        .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.jpegtran({progressive: true}),
                imageminJpegRecompress({
                    loops: 5,
                    min: 80,
                    max: 90,
                    quality: 'veryhigh'
                }),
                imagemin.svgo(),
                imagemin.optipng({optimizationLevel: 3}),
                pngquant({quality: [0.8, 0.9], speed: 3})
            ], {
                verbose: true
            })
        )
        .pipe(gulp.dest(build_path.imgContent))
});

// svg-sprite BUILD
gulp.task('images-svgSprite-build', function () {
    var listSCSS = [
        src_path.img + skinConfig.number + '/svg/*.svg',
        src_path.img + skinConfig.number + '/svg/' + skinConfig.theme + '/*.svg'
    ];
    gulp.src(listSCSS)
        .pipe(changed(build_path.img))
        .pipe(svgSprite({
                mode: {
                    stack: {
                        sprite: '../sprite.svg'  // sprite file name
                    }
                }
            }
        ))
        .pipe(cheerio({
            run: function ($) {
                $.root().children().first().removeAttr('viewBox');
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        .pipe(gulp.dest(build_path.img))
});
// svg-sprite BUILD end

// ****************************** IMAGES ****************************** //


// ****************************** JS ****************************** //

gulp.task('es-lint', function () {
    return gulp.src(src_path.js + 'custom.js')
        .pipe(eslint({
            configFile: ".es-lintrc"
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
});

gulp.task('js-dev', function () {
    gulp.src(src_path.js + '*.js')
        .pipe(gulp.dest(dev_path.js));
});

gulp.task('js-build', function () {
    gulp.src([src_path.js + '*.js', '!' + src_path.js + 'custom.js'])
        .pipe(gulp.dest(build_path.js));
});

gulp.task('js-build-custom', function () {
    gulp.src(src_path.js + 'custom.js')
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(build_path.js));
});


// ****************************** JS ****************************** //

// ****************************** FONTS ****************************** //

gulp.task('fonts-dev', function () {
    gulp.src(src_path.fonts + '*').pipe(gulp.dest(dev_path.fonts));
});

gulp.task('fonts-build', function () {
    gulp.src(src_path.fonts + '*').pipe(gulp.dest(build_path.fonts));
});


// ****************************** FONTS ****************************** //


// ****************************** WATCH ****************************** //

gulp.task('watch', function () {
    gulp.watch([src_path.pages_src + '*.pug'], ['replacePlaceholder']);
    gulp.watch([
        src_path.img + skinConfig.number + '/general/*.+(webp|png|jpg|svg|gif)',
        src_path.img + skinConfig.number + '/general/' + skinConfig.theme + '/*.+(webp|png|jpg|svg|gif)',
        src_path.components + '/*/*/*/*.+(webp|png|jpg|svg|gif)',
        src_path.components + '/*/*/*/*/*.+(webp|png|jpg|svg|gif)'
    ], ['images-general-dev']);
    gulp.watch([
        src_path.img + skinConfig.number + '/content/*'
    ], ['images-content-dev']);

    // svg-sprite watcher
    gulp.watch([
        src_path.img + skinConfig.number + '/svg/*.svg',
        src_path.img + skinConfig.number + '/svg/' + skinConfig.theme + '/*.svg)',
    ], ['images-svgSprite-dev']);
    // svg-sprite watcher end

    gulp.watch([
        src_path.components + '/*/*/*.scss',
        src_path.scss + '*.scss',
        src_path.scss + '/skins/*/*.scss',
        src_path.scss + '/themes/*.scss'
    ], ['sass-dev']);
    gulp.watch([
        src_path.pages + '*.pug',
        src_path.components + '/*/*/*.pug',
        src_path.components + 'common/*/*.pug'
    ], ['pug-dev']);
    gulp.watch([src_path.js + '*.js'], ['js-dev']);
    gulp.watch([src_path.fonts + '*'], ['fonts-dev']);
});

// ****************************** WATCH ****************************** //


// ****************************** SERVER ****************************** //

gulp.task('browsersync-server', function () {
    browsersync.init(null, {
        server: {baseDir: 'dev/'},
        open: false,
        notify: false,
        ghostMode: false
    });
});

// ****************************** SERVER ****************************** //

// ****************************** BUILD ALL ****************************** //

gulp.task('replacePlaceholder-all', function () {

    const files = fs.readdirSync(current_skin_path.pages_src, 'utf8');

    files.forEach(function (item, i, arr) {
        var contentFile = fs.readFileSync(current_skin_path.pages_src + item, 'utf8');

        contentFile = contentFile.replace(/\.\.\//g, "" + "../../");

        for (key in componentsConfig) {
            var st = '%=' + key + '=%',
                re = st,
                str = contentFile,
                newstr = str.replace(re, current_skin);

            fs.writeFileSync(current_skin_path.pages_dev + item, newstr, 'utf8');
            contentFile = newstr;
        }

    });
});

gulp.task('pug-build-all', function () {

    gulp.src([
        current_skin_path.pages_dev + '*.pug',
        '!' + current_skin_path.pages_dev + '_*.pug'
    ])
        .pipe(pug({pretty: true}))
        .on('error', console.log)
        .pipe(gulp.dest(current_skin_path.pages))
});

gulp.task('sass-build-all', function () {
    var listSCSS = [
        src_path.scss + 'normalize.scss',
        src_path.scss + 'mixins.scss',
        src_path.scss + 'vars.scss',
        src_path.scss + 'common.scss',
        src_path.scss + 'plugins.scss',
        src_path.scss + 'themes/' + current_theme + '.scss',
        src_path.scss + 'skins/' + current_skin + '/skin.scss'
    ];
    for (key in componentsConfig) {
        listSCSS.push(src_path.components + current_skin + '/' + componentsConfig[key].name + '/*.scss')
    }
    gulp.src(listSCSS)
        .pipe(autoprefixer())
        .pipe(concat(nameCSSfile + '.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(current_skin_path.css))
        .pipe(csso())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(current_skin_path.css))
});


gulp.task('images-general-build-all', function () {
    var listSCSS = [
        src_path.img + current_skin + '/general/*.+(webp|png|jpg|svg|gif)',
        src_path.img + current_skin + '/general/' + current_theme + '/*.+(webp|png|jpg|svg|gif)'
    ];
    for (key in componentsConfig) {
        listSCSS.push(src_path.components + current_skin + '/' + componentsConfig[key].name + '/img/*.+(webp|png|jpg|svg|gif)');
        listSCSS.push(src_path.components + current_skin + '/' + componentsConfig[key].name + '/img/' + current_theme + '/*.+(webp|png|jpg|svg|gif)')
    }
    gulp.src(listSCSS)
        .pipe(changed(current_skin_path.imgContent))
        .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.jpegtran({progressive: true}),
                imageminJpegRecompress({
                    loops: 5,
                    min: 80,
                    max: 90,
                    quality: 'veryhigh'
                }),
                imagemin.svgo(),
                imagemin.optipng({optimizationLevel: 3}),
                pngquant({quality: [0.8, 0.9], speed: 3})
            ], {
                verbose: true
            })
        )
        .pipe(gulp.dest(current_skin_path.img))
});
gulp.task('images-content-build-all', function () {
    gulp.src([src_path.img + current_skin + '/content/*'])
        .pipe(changed(current_skin_path.imgContent))
        .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.jpegtran({progressive: true}),
                imageminJpegRecompress({
                    loops: 5,
                    min: 80,
                    max: 90,
                    quality: 'veryhigh'
                }),
                imagemin.svgo(),
                imagemin.optipng({optimizationLevel: 3}),
                pngquant({quality: [0.8, 0.9], speed: 3})
            ], {
                verbose: true
            })
        )
        .pipe(gulp.dest(current_skin_path.imgContent))
});

gulp.task('images-svgSprite-build-all', function () {
    var listSCSS = [
        src_path.img + current_skin + '/svg/*.svg',
        src_path.img + current_skin + '/svg/' + current_theme + '/*.svg'
    ];
    gulp.src(listSCSS)
        .pipe(changed(current_skin_path.imgContent))
        .pipe(svgSprite({
                mode: {
                    stack: {
                        sprite: "../sprite.svg"  //sprite file name
                    }
                }
            }
        ))
        .pipe(cheerio({
            run: function ($) {
                $.root().children().first().removeAttr('viewBox');
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        .pipe(gulp.dest(current_skin_path.img))
});

gulp.task('js-build-all', function () {
    gulp.src([src_path.js + '*.js', '!' + src_path.js + '.js'])
        .pipe(gulp.dest(current_skin_path.js));
});

gulp.task('js-build-custom-all', function () {
    gulp.src(src_path.js + 'custom.js')
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(current_skin_path.js));
});

gulp.task('fonts-build-all', function () {
    gulp.src(src_path.fonts + '*').pipe(gulp.dest(current_skin_path.fonts));
});

// ****************************** BUILD ALL ****************************** //


gulp.task('default', [
    'clean', 'clean-dev', 'replacePlaceholder', 'pug-dev', 'sass-dev', 'images-general-dev', 'images-content-dev', 'images-svgSprite-dev', 'js-dev', 'fonts-dev', 'browsersync-server', 'watch'
]);

gulp.task('build', gulpsync.async([
    ['pug-lint', 'sass-lint', 'es-lint', ['clean', 'clean-dev', 'replacePlaceholder', 'pug-build', 'sass-build', 'images-general-build', 'images-content-build', 'images-svgSprite-build', 'js-build-custom', 'js-build', 'fonts-build']]
]));

gulp.task('build-item', [
    'replacePlaceholder-all', 'pug-build-all', 'sass-build-all', 'images-general-build-all', 'images-content-build-all', 'images-svgSprite-build-all', 'js-build-custom-all', 'js-build-all', 'fonts-build-all'
]);

gulp.task('build-all-enum', function () {
    skinConfig.themes.forEach(dir => {
        skinConfig.skins.forEach(items => {
            if (!fs.existsSync(`markup/pages/${items}_${dir}/`))
                fs.mkdirSync(`markup/pages/${items}_${dir}/`)
        });
    });

    skinConfig.themes.forEach(function (elem, index) {
        current_theme = elem;
        skinConfig.skins.forEach(function (elem, index) {
            current_skin = elem;
            current_skin_path = {
                pages_src: `markup/pages-src/${current_skin}/`,
                pages_dev: `markup/pages/${current_skin}_${current_theme}/`,
                pages: `builds_all/build_${current_skin}_${current_theme}/`,
                css: `builds_all/build_${current_skin}_${current_theme}/static/css/`,
                js: `builds_all/build_${current_skin}_${current_theme}/static/js/`,
                fonts: `builds_all/build_${current_skin}_${current_theme}/static/fonts/`,
                img: `builds_all/build_${current_skin}_${current_theme}/static/img/general/`,
                imgContent: `builds_all/build_${current_skin}_${current_theme}/static/img/content/`
            };
            gulp.start('build-item');
        })
    })
});

// task for back-end
gulp.task('build-back-end', [
    'clean', 'clean-dev', 'sass-build', 'images-general-build', 'images-content-build', 'images-svgSprite-build', 'js-build-custom', 'js-build', 'fonts-build'
]);


gulp.task('build-all', gulpsync.async([
    ['clean-dev', 'clean', 'pug-lint', 'sass-lint', 'es-lint', 'build-all-enum']
]));
