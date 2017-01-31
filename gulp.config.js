import wiredep from 'wiredep';

const build = './build/';
const bower = {
        json: require('./bower.json'),
        directory: './bower_components',
        ignorePath: '../..'  
};
const bowerFiles = wiredep({devDependencies: true})['js'];
const client = './src/client/';
const clientApp = client + 'app/';
const packages = [
    './package.json',
    './bower.json',

];
const root = '.';
const report = './report/';
const server = './src/server/';
const temp = './.tmp/';


const serverIntegrationSpecs = [client + 'tests/server-integration/**/*.spec.js'];
const specHelpers = [client + 'test-helpers/**/*.js'];

const getWiredepDefaultOptions = () =>{
        const options = {
            bowerJson:  bower.json,
            directory:  bower.directory,
            ignorePath: bower.ignorePath
        };
        return options;
};

const getKarmaOptions = () => {
    let options = {
        files: [].concat(
            bowerFiles, 
            specHelpers, 
            client + '**/*.module.js',  
            client + '**/*.js',
            serverIntegrationSpecs ),
        exclude: [],
        coverage: {
            dir: report + 'coverage',
            reporters: [
                {
                    type: 'html', subdir: 'report-html',
                },
                {
                    type: 'lcov', subdir: 'report-lcov',
                },                
                {
                    type: 'text-summary'
                }
            ]
        },
        preprocessors: {}
    };
    options.preprocessors[clientApp + '**/!(*.spec)+(*.js)'] = ['coverage'];
    return options;
};

export default {
    /**
     * Node Settings
     */
    defaultPort: 7203,
    nodeServer: server + 'app.js',
    server,
    browserReloadDelay: 1000,
    

    /**
     * Template cache
     */

    templateCache:{
        file: 'templates.js',
        options: {
            module: 'app.core',
            standAlone: false,
            root: 'app/'
        }
    },

    /**
     * Karma config
     */
    karma: getKarmaOptions(),
    serverIntegrationSpecs,
    specHelpers,
    report,

    /**
     * File paths
     */
    alljs:[
        './src/**/*.js',
        './*js'
    ],
    build,
    css: temp + 'styles.css' ,
    fonts: './bower_components/font-awesome/fonts/**/*',
    html: '**/*.html',
    htmltemplates: clientApp + '**/*.html',
    index: client + 'index.html',
    images: client + 'images/**/*',
    js: [
        clientApp + '**/*.module.js',
        clientApp + '**/*.js',
        '!' + clientApp + '**/*.spec.js',
    ],
    less: client + 'styles/*.less',
    bower,
    client,
    getWiredepDefaultOptions,
    packages,
    root,
    temp,

    /**
     * optimized files
     */

    optimized: {
        app:'app.js',
        lib:'lib.js'
    }
};

