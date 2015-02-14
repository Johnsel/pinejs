webpack = require 'webpack'
_ = require 'lodash'

clientConfigs =
	'client': require './src/client/build/client.coffee'
	'client-server': require './src/client/build/client-server.coffee'
	'ddui': require './src/client/build/ddui.coffee'
	'sbvr.co': require './src/client/build/sbvr.co.coffee'
serverConfigs =
	'browser': require './src/server/build/browser.coffee'
	'module': require './src/server/build/module.coffee'
	'server': require './src/server/build/server.coffee'

clientDevConfigs = {}
for task, config of clientConfigs
	clientDevConfigs[task] = _.clone(config)
	clientDevConfigs[task].plugins = _.clone(config.plugins)
	config.plugins = config.plugins.concat(
		new webpack.optimize.UglifyJsPlugin(
			compress:
				unused: false # We need this off for OMeta
		)
	)

for task, config of serverConfigs
	config.plugins.push(
		new webpack.optimize.UglifyJsPlugin(
			output:
				beautify: true
				ascii_only: true
			compress:
				sequences: false
				unused: false # We need this off for OMeta
			mangle: false
		)
	)

module.exports = (grunt) ->
	grunt.initConfig
		clean: ['out']

		checkDependencies:
			this:
				options:
					packageManager: 'npm'
					onlySpecified: false # This complains about .bin


		concat:
			_.mapValues serverConfigs, (config, task) ->
				defines = _.find(config.plugins, (plugin) -> plugin.definitions?).definitions
				return {
					options:
						banner: """
							/*! Build: #{task} - <%= grunt.option('version') %>
							Defines: #{JSON.stringify(defines, null, '\t')}
							*/
						"""
					src: ['out/pine.js']
					dest: 'out/pine.js'
				}

		copy:
			client:
				files: [
					expand: true
					cwd: 'src/client/src/static'
					src: '**'
					dest: 'out/static'
				]

		'git-describe':
			this: {}

		htmlmin:
			client:
				options:
					removeComments: true
					removeCommentsFromCDATA: true
					collapseWhitespace: false
				files: [
					src: 'src/client/src/index.html'
					dest: 'out/index.html'
				]

		imagemin:
			client:
				options:
					optimizationLevel: 3
				files: [
					expand: true
					cwd: 'out/static/'
					src: '*'
					dest: 'out/static/'
				]

		rename: do ->
			renames = {}
			for task, config of serverConfigs
				renames[task] =
					src: 'out/pine.js'
					dest: "out/pine-#{task}-<%= grunt.option('version') %>.js"
				renames["#{task}.map"] =
					src: 'out/pine.js.map'
					dest: "out/pine-#{task}-<%= grunt.option('version') %>.js.map"
			return renames

		replace:
			_.extend
				'pine.js':
					src: 'out/pine.js'
					overwrite: true
					replacements: [
						from: /nodeRequire/g
						to: 'require'
					]
				_.mapValues serverConfigs, (v, task) ->
					src: 'out/pine.js'
					overwrite: true
					replacements: [
						from: /sourceMappingURL=pine.js.map/g
						to: "sourceMappingURL=pine-#{task}-<%= grunt.option('version') %>.js.map"
					]

		webpack: _.extend({}, clientConfigs, serverConfigs)
		"webpack-dev-server": 
			_.mapValues clientDevConfigs, (config) ->
				keepAlive: true
				contentBase: 'src/client/src/'
				webpack: config

	grunt.loadNpmTasks('grunt-check-dependencies')
	grunt.loadNpmTasks('grunt-contrib-clean')
	grunt.loadNpmTasks('grunt-contrib-concat')
	grunt.loadNpmTasks('grunt-contrib-copy')
	grunt.loadNpmTasks('grunt-contrib-htmlmin')
	grunt.loadNpmTasks('grunt-contrib-imagemin')
	grunt.loadNpmTasks('grunt-git-describe')
	grunt.loadNpmTasks('grunt-rename')
	grunt.loadNpmTasks('grunt-text-replace')
	grunt.loadNpmTasks('grunt-webpack')

	grunt.event.once 'git-describe', ([version]) ->
		grunt.option('version', version)

	for task of clientConfigs
		grunt.registerTask task, [
			'copy:client'
			'imagemin:client'
			'htmlmin:client'
			'webpack:' + task
		]

	for task of serverConfigs
		grunt.registerTask task, [
			'checkDependencies'
			'webpack:' + task
			'git-describe'
			'replace:pine.js'
			"replace:#{task}"
			"concat:#{task}"
			"rename:#{task}"
			"rename:#{task}.map"
		]