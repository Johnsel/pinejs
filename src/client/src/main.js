require({
	config: {
		has: {
			TAB_SBVR_EDITOR			: true,
			TAB_SBVR_LF				: true,
			TAB_SBVR_GRAPH			: true,
			TAB_SBVR_SERVER			: true,
			TAB_DDUI				: true,
			TAB_DB_IMPORT_EXPORT	: true,
			TAB_VALIDATE			: true,

			SBVR_EXTENSIONS: true,
			
			// For the in-browser server
			ENV_NODEJS				: false,
			ENV_BROWSER				: true,
			SBVR_SERVER_ENABLED		: true,
			DEV						: true,

			CONFIG_LOADER			: false
		}
	},
	paths: {
		//Developing & building tools
		'cache'						: '../../client/lib/require-cache/cache',
		'cs'						: '../../client/lib/require-cs/cs',
		'ometa'						: '../../../node_modules/ometa-js/lib/requirejs-plugin/ometajs',
		'text'						: '../../client/lib/requirejs-text/text',
		'coffee-script'				: '../../client/lib/coffee-script/extras/coffee-script',
		'has'						: '../../tools/has',

		'lib'						: '../lib',

		'ometa-parsers'				: '../../../node_modules/ometa-js/lib/ometajs/ometa/parsers',
		'uglify-js'					: '../../../node_modules/ometa-js/examples/vendor/uglify',

		//Libraries
		'async'						: '../lib/async/lib/async',
		'backbone'					: '../lib/backbone/backbone',
		'bcryptjs'					: '../lib/bcryptjs/dist/bcrypt',
		'bootstrap'					: '../lib/bootstrap/docs/assets/js/bootstrap',
		'codemirror-ometa'			: '../../../node_modules/ometa-js/lib/codemirror-ometa',
		'd3'						: '../lib/d3/d3',
		'jquery'					: '../lib/jquery/jquery',
		'jquery-xdomain'			: '../lib/jquery-xdomain',
		'ometa-core'				: '../../../node_modules/ometa-js/lib/ometajs/core',
		'lodash'					: '../../../node_modules/lodash/dist/lodash.compat',
		'ejs'						: '../lib/ejs/ejs',
		'jquery-ui'					: '../lib/jquery-ui/ui/jquery-ui',
		
		// For the in-browser server
		'bluebird'					: '../lib/bluebird/js/browser/bluebird',
		'odata-parser'				: '../../../node_modules/odata-parser/odata-parser',
		'odata-to-abstract-sql'		: '../../../node_modules/odata-to-abstract-sql/odata-to-abstract-sql',
		'config-loader'				: '../../server/src/config-loader',
		'typed-error'				: '../../../node_modules/typed-error/src/typed-error',
		'database-layer'			: '../../server/src/database-layer',
		'data-server'				: '../../server/src/data-server',
		'express-emulator'			: '../../server/src/express-emulator',
		'migrator'					: '../../server/src/migrator',
		'passport-pinejs'			: '../../server/src/passport-pinejs',
		'pinejs-session-store'	: '../../server/src/pinejs-session-store',
		'server-glue'				: '../../server/src/server-glue',
		'sbvr-api'					: '../../server/src/sbvr-api',
		'sbvr-compiler'				: '../../server/src/sbvr-compiler'
	},
	packages: [
		{
			name: 'sbvr-parser',
			location: '../../../node_modules/sbvr-parser',
			main: 'sbvr-parser'
		},
		{
			name: 'sbvr-types',
			location: '../../../node_modules/sbvr-types',
			main: 'bin/types'
		},
		{
			name: 'extended-sbvr-parser',
			location: '../../common/extended-sbvr-parser',
			main: 'extended-sbvr-parser'
		},
		{
			name: 'lf-to-abstract-sql',
			location: '../../../node_modules/lf-to-abstract-sql',
			main: 'index'
		},
		{
			name: 'abstract-sql-compiler',
			location: '../../../node_modules/abstract-sql-compiler',
			main: 'index'
		},
		{
			name: 'pinejs-client-js',
			location: '../../../node_modules/pinejs-client-js',
			main: 'core'
		},
		{
			name: 'css',
			location: '../../client/lib/require-css',
			main: 'css'
		},
		{
			name: 'codemirror',
			location: '../lib/codemirror',
			main: 'lib/codemirror'
		}
	],
	shim: {
		'bootstrap': {
			deps: ['jquery', 'css!lib/bootstrap/docs/assets/css/bootstrap']
		},
		'sbvr-types': {
			deps: ['bcryptjs']
		},
		'css!static/main': {
			deps: ['bootstrap'],
		},
		'codemirror/addon/hint/show-hint': {
			deps: ['css!lib/codemirror/addon/hint/show-hint']
		},
		'codemirror': {
			deps: [ 'css!lib/codemirror/lib/codemirror']
		},
		'ejs': {
			exports: 'ejs'
		},
		'jquery-ui': {
			deps: ['jquery']
		},
		'jquery-xdomain': {
			deps: ['jquery']
		},
		'd3': {
			exports: 'd3'
		},
		'backbone': {
			deps: ['lodash', 'jquery-xdomain'],
			exports: 'Backbone',
			init: function () {
				return this.Backbone.noConflict();
			}
		},
		'uglify-js': {
			exports: 'UglifyJS'
		}
	}
}, ['cs!app', 'css!static/main']);
