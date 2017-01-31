const client = './src/client/';
const clientApp = client + 'app/';
const temp = './.tmp/';
const server = './src/server/';
const build = './build/';
const root = './';
const bower = {
        json: require('./bower.json'),
        directory: './bower_components',
        ignorePath: '../..'  
};

const packages = [
    './package.json',
    './bower.json',

]

const getWiredepDefaultOptions = () =>{
        const options = {
            bowerJson:  bower.json,
            directory:  bower.directory,
            ignorePath: bower.ignorePath
        };
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

