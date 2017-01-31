import gulp from 'gulp';
import args from 'yargs';
import config from './gulp.config';
import del from 'del';
import wiredep from 'wiredep';
import browserSync from 'browser-sync';
import useref from 'gulp-useref';
import carma from 'karma';

import loadplugins from 'gulp-load-plugins';
const $ = loadplugins ({lazy: true});

const port = process.env.PORT || config.defaultPort;

const log = (msg) => {
  if (typeof(msg) === 'object') {
    for (const item in msg){
      if(msg.hasOwnProperty(item)){
        $.util.log($.util.colors.blue(msg[item]));
      }
    }
  } else {
    $.util.log($.util.colors.blue(msg));
  }
};

const clean = path => {
  log('Cleaning: ' + $.util.colors.magenta(path));
  return del(path);
};

const changeEvent = event =>{
  const regex = new RegExp('/.*(?=/' + config.source + ')/');
  log('File ' + event.path.replace(regex, '')+ ' ' + event.type);
};


gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

gulp.task('vet', () => {
  return gulp
  .src(config.alljs)
  .pipe($.if(args.argv.verbose, $.print()))
  .pipe($.jscs())
  .pipe($.jshint())
  .pipe($.jshint.reporter('jshint-stylish',{verbose:true}))
  .pipe($.jshint.reporter('fail'));
});

gulp.task('styles',['clean-styles'],()=>{
  log('Compiling Less ===> CSS');

  return gulp
  .src(config.less)
  .pipe($.plumber())
  .pipe($.less())
  .pipe($.autoprefixer({browsers:['last 2 version', '> 5%']}))
  .pipe(gulp.dest(config.temp));

});

gulp.task('fonts',['clean-fonts'],()=>{

  log('Copying fonts');

  return gulp.src(config.fonts)
  .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images',['clean-images'],()=>{
    log('Copying images and compressing them');

  return gulp.src(config.images)
  .pipe($.imagemin({
    optimizationLevel: 7
  }))
  .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean', ()=>{
  let delConfig = [].concat(config.build,config.temp);
  log('Cleaning: ' + $.util.colors.blue(delConfig));
  return del(delConfig);
});

gulp.task('clean-fonts', ()=>{
  return clean(config.build + 'fonts/**/*');
});
gulp.task('clean-images', ()=>{
  return clean(config.build + 'images/**/*');
});

gulp.task('clean-styles', ()=>{
  return clean(config.temp + '**/*.css');
});

gulp.task('clean-code', ()=>{
  const files = [].concat(
    config.temp + '**/*.js',
    config.build + '**/*.html',
    config.build + 'js/**/*.js'
    );
  return clean(files);
});

gulp.task('templatecache',['clean-code'], ()=>{
    log('Creating AngularJS $templateCache');
    return gulp
    .src(config.htmltemplates)
    .pipe($.minifyHtml({empty: true}))
    .pipe($.angularTemplatecache(
      config.templateCache.file,
      config.templateCache.options
    ))
    .pipe(gulp.dest(config.temp));
});

gulp.task('less-watcher', () =>{
  gulp.watch([config.less], ['styles']);
});

gulp.task('wiredep', ()=>{
  const options = config.getWiredepDefaultOptions();
  const wiredepPipe = wiredep.stream;

  return gulp
  .src(config.index)
  .pipe(wiredepPipe(options))
  .pipe($.inject(gulp.src(config.js)))
  .pipe(gulp.dest(config.client));
});

gulp.task('inject',['templatecache','styles','wiredep'], ()=>{
  return gulp
  .src(config.index)
  .pipe($.inject(gulp.src(config.css)))
  .pipe(gulp.dest(config.client));
});

gulp.task('optimize',['inject','fonts','images'],()=>{
  
  log('Optimizing the javascript, css, html');
  const templateCache = config.temp + config.templateCache.file;
  const cssFilter = $.filter('**/*.css',{restore:true});
  const jsLibFilter = $.filter('**/' + config.optimized.lib,{restore:true});
  const jsAppFilter = $.filter('**/' + config.optimized.app,{restore:true});
  const excludeIndexFilter = $.filter(['**/*','!*src/client/index.html'] ,{restore:true});

  return gulp
  .src(config.index)
  .pipe($.plumber())
  .pipe($.inject(gulp.src(templateCache,{read: false}), {
    starttag: '<!-- inject:templates:js -->'
  }))
  .pipe(useref({searchPath:'./'}))
  .pipe(excludeIndexFilter)
  .pipe($.rev())
  .pipe(excludeIndexFilter.restore)
  .pipe(jsLibFilter)
  .pipe($.uglify())
  .pipe(jsLibFilter.restore)
  .pipe(jsAppFilter)
  .pipe($.ngAnnotate())
  .pipe($.uglify())
  .pipe(jsAppFilter.restore)
  .pipe(cssFilter)
  .pipe($.csso())
  .pipe(cssFilter.restore)
  .pipe($.revReplace())
  .pipe(gulp.dest(config.build))
  .pipe($.rev.manifest())
  .pipe(gulp.dest(config.build));
});

const startBrowserSync = isDev => {

  if(args.nosync || browserSync.active){
    return;
  }

  log('Starting browser-sync on port: ' + port);

  if(isDev){
    gulp.watch([config.less], ['styles'])
    .on('change', event=>{
      changeEvent(event);
    });
  } else {
    gulp.watch([config.less, config.js, config.html], ['optimize'])
    .on('change', event=>{
      changeEvent(event);
    });
  }

  const options = {
    proxy:'localhost:' + port,
    port: 3000,
    files: isDev ? [
      '!**/*.less',
      config.client + '**/*',
      config.temp + '**/*.css'
    ] : [],
    ghostMode: {
      clicks: true,
      location: false,
      forms: true,
      scroll: true
    },
    injectChanges: true,
    logFileChanges: true,
    logLevel: 'debug',
    logPrefix: 'gulp-patterns',
    notify: true,
    reloadDelay: 0 //1000
  };
  log('Покрећем бровзер синк на порту '+port);
  browserSync(options);

};

const startTests = (singleRun) => {
  const karma = carma.server;
  let excludeFiles = [];
  const serverSpecs = config.serverIntegrationSpecs;

  excludeFiles = serverSpecs;

  const karmaCompleted = karmaResult => {
    log('Karma completed');
    if (karmaResult === 1) {
      log('karma: tests failed with code ' + karmaResult );
    } else {
      return;
    }
  };

  karma.start({
    configFile: __dirname + '/karma.conf.js',
    exclude: excludeFiles,
    singleRun: !!singleRun
  },karmaCompleted);

};

const serve = isDev =>{

  const nodeOptions = {
    script: config.nodeServer,
    delayTime: 1,
    env: {
      'PORT': port,
      'NODE_ENV': isDev ? 'dev' : 'build'
    },
    watch: [config.server]
  };

  return $.nodemon(nodeOptions)
  .on('restart', event =>{
    log('*** nodemon restarted ***');
    log('files changed on restart\n' + event );
    setTimeout( ()=>{
      browserSync.notify('reloading now....');
      browserSync.reload({
        stream:false
      });
    },config.browserReloadDelay);
  })
  .on('start',()=>{
     log('*** nodemon started ***');
     startBrowserSync(isDev);
  })
  .on('crash',()=>{
     log('*** nodemon crashed for some reason ***');
  })
  .on('exit',()=>{
     log('*** nodemon exited cleanly ***');
  });
};

gulp.task('serve-build',['optimize'], ()=>{
  serve(false);
});


gulp.task('serve-dev',['inject'], ()=>{
 serve(true);
});

/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*-x
 * --type=patch or no flag will bump the patch version *.*.x
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --version=1.2.3 will bump to a specific version and ignore other flags
 * 
 */
gulp.task('bump', ()=>{
  let msg = 'Bumping versions';
  let options = {} ;
  const type = args.argv.type;
  const version = args.argv.version;

  if(version){
    options.version = version;
    msg += ' to ' + version;
  } else{
    options.type = type;
    msg += ' for a ' + type;
  }
  log(msg);
  return gulp
  .src(config.packages)
  .pipe($.print())
  .pipe($.bump(options))
  .pipe(gulp.dest(config.root));
});

gulp.task ('test',['vet','templatecache'], () =>{
  startTests(true);
});