define [
	'exports'
	'has'
	'lodash'
	'bluebird'
	'cs!sbvr-api/sbvr-utils'
], (exports, has, _, Promise, sbvrUtils) ->
	# Setup function
	exports.setup = (app, requirejs) ->
		authAPI = sbvrUtils.api.Auth
		loadConfig = (data) ->
			sbvrUtils.db.transaction().then (tx) ->
				modelsPromise = Promise.map data.models, (model) ->
					if model.modelText?
						sbvrUtils.executeModel(tx, model)
						.then ->
							console.info('Sucessfully executed ' + model.modelName + ' model.')
						.catch (err) ->
							throw new Error(['Failed to execute ' + model.modelName + ' model from ' + model.modelFile, err])

				if data.users?
					permissions = {}
					for user in data.users when user.permissions?
						_.each user.permissions, (permissionName) ->
							permissions[permissionName] ?=
								authAPI.get(
									resource: 'permission'
									options:
										select: 'id'
										filter:
											name: permissionName
									tx: tx
								).then (result) ->
									if result.length is 0
										authAPI.post(
											resource: 'permission'
											body:
												name: permissionName
											tx: tx
										).get('id')
									else
										return result[0].id
								.catch (err) ->
									throw new Error('Could not create or find permission "' + permissionName + '": ' + err)

					usersPromise = Promise.map data.users, (user) ->
						authAPI.get(
							resource: 'user'
							options:
								select: 'id'
								filter:
									username: user.username
							tx: tx
						).then (result) ->
							if result.length is 0
								authAPI.post(
									resource: 'user'
									body:
										username: user.username
										password: user.password
									tx: tx
								).get('id')
							else
								return result[0].id
						.then (userID) ->
							if user.permissions?
								Promise.map user.permissions, (permissionName) ->
									permissions[permissionName].then (permissionID) ->
										authAPI.get(
											resource: 'user__has__permission'
											options:
												select: 'id'
												filter:
													user: userID
													permission: permissionID
											tx: tx
										).then (result) ->
											if result.length is 0
												authAPI.post(
													resource: 'user__has__permission'
													body:
														user: userID
														permission: permissionID
													tx: tx
												)
						.catch (err) ->
							throw new Error('Could not create or find user "' + user.username + '": ' + err)
				Promise.all([modelsPromise, usersPromise])
				.catch (err) ->
					tx.rollback()
					throw err
				.then ->
					tx.end()
					Promise.map data.models, (model) ->
						if model.modelText?
							apiRoute = '/' + model.apiRoot + '/*'
							app.options(apiRoute, (req, res) -> res.send(200))
							app.all(apiRoute, sbvrUtils.handleODataRequest)

						if model.customServerCode?
							try
								customCode = requirejs(model.customServerCode)
							catch e
								try
									customCode = require(model.customServerCode)
								catch ee
									throw new Error('Error loading custom server code: ' + e + ee)

							if !_.isFunction(customCode.setup)
								return

							try
								deferred = Promise.pending()
								promise = customCode.setup app, requirejs, sbvrUtils, sbvrUtils.db, (err) ->
									if err
										deferred.reject(err)
									else
										deferred.fulfill()

								if Promise.is(promise)
									deferred.fulfill(promise)

								return deferred.promise
							catch e
								throw new Error('Error running custom server code: ' + e)

		loadNodeConfig = (config) ->
			if not has 'ENV_NODEJS'
				console.error('Can only load a node config in a nodejs environment.')
				return

			try # Try to register the coffee-script loader - ignore if it fails though, since that probably just means it is not available/needed.
				require('coffee-script/register')

			readFile = Promise.promisify(require('fs').readFile)
			path = require('path')

			console.info('Loading application config')
			switch typeof config
				when "undefined"
					root = process.argv[2] or __dirname
					config = require path.join(root, 'config.json')
				when "string"
					root = path.dirname(require.resolve config)
					config = require config
				when "object"
					root = process.cwd()

			Promise.map config.models, (model) ->
				readFile(path.join(root, model.modelFile), 'utf8')
				.then (sbvrModel) ->
					model.modelText = sbvrModel
					if model.customServerCode?
						model.customServerCode = root + '/' + model.customServerCode
			.then ->
				loadConfig(config)
			.catch (err) ->
				console.error('Error loading config', err, err.stack)
				process.exit()

		return {
			loadConfig
			loadNodeConfig
		}

	return exports
