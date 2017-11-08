import * as _express from 'express'

import * as _ from 'lodash'
import * as Promise from 'bluebird'
import * as path from 'path'
import * as fs from 'fs'
// We force the type to match the specific overloaded version we want, as promisify can only choose one :(
const readFileAsync = Promise.promisify(fs.readFile) as any as (filename: string, encoding: string) => Promise<string>
const readdirAsync = Promise.promisify(fs.readdir)

import * as sbvrUtils from '../sbvr-api/sbvr-utils'
const permissions = require('../sbvr-api/permissions')

export interface SetupFunction {
	(app: _express.Application, sbvrUtils: any, db: any, done: (err: any) => void): Promise<void> | void
}

export interface Model {
	apiRoot?: string
	modelName?: string
	modelFile?: string
	modelText?: string
	migrationsPath?: string
	customServerCode?: string | {
		setup: SetupFunction
	}
}
export interface User {
	username: string
	password: string
	permissions: string[]
}
export interface Config {
	models: Model[]
	users?: User[]
}

// Setup function
export const setup = (app: _express.Application) => {
	const loadConfig = (data: Config): Promise<void> =>
		sbvrUtils.db.transaction()
		.then((tx) =>
			Promise.map(data.models, (model) => {
				if (model.modelText != null) {
					return sbvrUtils.executeModel(tx, model).then(() => {
						console.info('Successfully executed ' + model.modelName + ' model.')
					}).catch((err) => {
						const message = `Failed to execute ${model.modelName} model from ${model.modelFile}`
						if (_.isError(err)) {
							err.message = message
							throw err
						}
						throw new Error(message)
					})
				}
			}).then((): undefined | Promise<any> => {
				const authApiTx = sbvrUtils.api.Auth.clone({
					passthrough: {
						tx,
						req: permissions.root,
					}
				})

				if (data.users != null) {
					const permissionsCache: {
						[index: string]: Promise<number>
					} = {}
					_.each(data.users, (user) => {
						if (user.permissions == null) {
							return
						}
						_.each(user.permissions, (permissionName) => {
							if (permissionsCache[permissionName] != null) {
								return
							}
							permissionsCache[permissionName] = authApiTx.get({
								resource: 'permission',
								options: {
									select: 'id',
									filter: {
										name: permissionName
									}
								}
							}).then((result) => {
								if (result.length === 0)
									return authApiTx.post({
										resource: 'permission',
										body: {
											name: permissionName
										}
									}).get('id')
								else {
									return result[0].id
								}
							}).catch((e) => {
								e.message = `Could not create or find permission "${permissionName}": ${e.message}`
								throw e
							})
						})
					})

					return Promise.map(data.users, (user) => {
						return authApiTx.get({
							resource: 'user',
							options: {
								select: 'id',
								filter: {
									username: user.username
								}
							}
						}).then((result): number => {
							if (result.length === 0)
								return authApiTx.post({
									resource: 'user',
									body: {
										username: user.username,
										password: user.password
									}
								}).get('id')
							else {
								return result[0].id
							}
						}).then((userID): undefined | Promise<any> => {
							if (user.permissions != null) {
								return Promise.map(user.permissions, (permissionName) =>
									permissionsCache[permissionName]
									.then((permissionID) => {
										return authApiTx.get({
											resource: 'user__has__permission',
											options: {
												select: 'id',
												filter: {
													user: userID,
													permission: permissionID
												}
											}
										})
									}).then((result) => {
										if (result.length === 0) {
											return authApiTx.post({
												resource: 'user__has__permission',
												body: {
													user: userID,
													permission: permissionID,
												},
											})
										}
									})
								)
							}
						}).catch((e) => {
							e.message = `Could not create or find user "${user.username}": ${e.message}`
							throw e
						})
					)
				}
			}).tapCatch(() => {
				return tx.rollback()
			}).then(() => {
				return tx.end()
			}).then(() => {
				return Promise.map(data.models, (model): Promise<any> | void => {
					if (model.modelText != null) {
						const apiRoute = `/${model.apiRoot}/*`
						app.options(apiRoute, (_req, res) => res.sendStatus(200))
						app.all(apiRoute, sbvrUtils.handleODataRequest)
					}

					if (model.customServerCode != null) {
						let customCode: SetupFunction
						if (_.isString(model.customServerCode)) {
							try {
								customCode = nodeRequire(model.customServerCode).setup
							} catch (e) {
								e.message = `Error loading custom server code: '${e.message}'`
								throw e
							}
						} else if (_.isObject(model.customServerCode)) {
							customCode = model.customServerCode.setup
						} else {
							throw new Error(`Invalid type for customServerCode '${typeof model.customServerCode}'`)
						}

						if (!_.isFunction(customCode)) {
							return
						}

						return new Promise((resolve, reject) => {
							const promise = customCode(app, sbvrUtils, sbvrUtils.db, (err) => {
								if (err) {
									reject(err)
								} else {
									resolve()
								}
							})

							if (Promise.is(promise)) {
								resolve(promise)
							}
						})
					}
				})
			})
		).then(() => {})


	const loadJSON = (path: string): Config => {
		console.info('Loading JSON:', path)
		const json = fs.readFileSync(path, 'utf8')
		return JSON.parse(json)
	}

	const loadApplicationConfig = (config?: string | Config) => {
		if (require.extensions['.coffee'] == null) {
			try {
				// Try to register the coffee-script loader if it doesn't exist
				// We ignore if it fails though, since that probably just means it is not available/needed.
				require('coffee-script/register')
			}
			catch (e) {}
		}
		if (require.extensions['.ts'] == null ) {
			try {
				require('ts-node/register')
			} catch (e) {}
		}

		console.info('Loading application config')
		let root: string
		let configObj: Config
		if (config == null) {
			root = process.argv[2] || __dirname
			configObj = loadJSON(path.join(root, 'config.json'))
		} else if (_.isString(config)) {
			root = path.dirname(config)
			configObj = loadJSON(config)
		} else if (_.isObject(config)) {
			root = process.cwd()
			configObj = config
		}
		else {
			return Promise.reject(new Error(`Invalid type for config '${typeof config}'`))
		}

		return Promise.map(configObj.models, (model) => {
			return Promise.try<string | undefined>(() => {
				if (model.modelFile != null) {
					return readFileAsync(path.join(root, model.modelFile), 'utf8')
				}
				return model.modelText
			}).then((modelText) => {
				model.modelText = modelText
				if (model.customServerCode != null) {
					model.customServerCode = root + '/' + model.customServerCode
				}
			}).then(() => {
				const migrations: {
					[index: string]: string
				} = {}

				if (model.migrationsPath) {
					const migrationsPath = path.join(root, model.migrationsPath)

					return readdirAsync(migrationsPath).map((filename: string) => {
						const filePath = path.join(migrationsPath, filename)
						const migrationKey = filename.split('-')[0]

						switch (path.extname(filename)) {
							case '.coffee':
							case '.js':
								migrations[migrationKey] = nodeRequire(filePath)
							break
							case '.sql':
								return readFileAsync(filePath, 'utf8').then((sql) => {
									migrations[migrationKey] = sql
								})
							default:
								console.error(`Unrecognised migration file extension, skipping: ${path.extname(filename)}`)
						}
					}).return()
				}
			})
		}).then(() => {
			return loadConfig(configObj)
		}).catch((err) => {
			console.error('Error loading application config', err, err.stack)
			process.exit(1)
		})
	}

	return {
		loadConfig,
		loadApplicationConfig,
	}
}