import express from 'express'
import cors from 'cors'
import https from 'https'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

import { Routes } from './routes.js'

import SocketServer from './socket.js'
import FileWatcher from './watcher.js'
import { isOriginAllowed } from './util/index.js'

import ClientInjecter from './injecter.js'

import DefaultClient from './default/client.js'
import DefaultConfig from './default/config.js'

export default class HotServer {
	constructor (config) {
		this.config = {...DefaultConfig, ...config}
		this.domain = `${this.config.host}:${this.config.port}`
		this.url = `${this.config.protocol}://${this.domain}`
		this.root = process.cwd()
		this.dir = path.dirname(fileURLToPath(import.meta.url))
		this.rootFolder = path.basename(this.root)
		this.plugins = this.config.plugins || []
		this.clients = [DefaultClient, ...this.config.clients || []]

		this.clientDomains = [this.domain, ...this.config.domains || [], ...this.clients.map(c => c.domain)].filter(Boolean)
	}

	init () {
		this.initServer()
		
		this.ws = new SocketServer(this)
		this.watch = new FileWatcher(this).start()

		this.plugins.forEach(plugin => {
			if (plugin.configureServer) {
				plugin.configureServer(this)
			}
			console.info(`Plugin: loaded "${plugin.name || ''}"`)
		})

		this.injecter = new ClientInjecter(this)
		this.injecter.remove()
		this.injecter.inject()

		this.clients.forEach(client => client?.engine?.back?.init && client.engine.back.init(client, this))
	}

	getCors () {
		const config = this.config
		const domains = this.clientDomains

		return {
			origin: (origin, cb) => {
				if (!origin) return cb(null, true)

				// Check if the origin matches our allowed domains
				if (isOriginAllowed(origin, domains)) return cb(null, true)
		
				cb(new Error(`Not allowed by CORS - Only ${domains.join(', ')} are allowed`))
			},
			methods: ['GET', 'POST', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization'],
			credentials: config.credentials
		}
	}

	initServer () {
		const app = express()
		app.use(cors(this.getCors()))
		// Add security headers middleware
		app.use((req, res, next) => {
			// Add security headers
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
			res.setHeader('Access-Control-Allow-Credentials', 'true')
			res.setHeader('X-Content-Type-Options', 'nosniff')
			next()
		})

		if (this.config.protocol === 'https') {
			this.server = https.createServer(this.config.ssl, app)
		} else {
			this.server = http.createServer(app)
		}

		Routes(app, this)

		this.server.listen(this.config.port, this.config.host, () => {
			console.info('----------------------------------------------')
			console.info(`Server is running on: ${this.url}`)
			console.info('Reload app to connect')
			console.info('----------------------------------------------')
		}).on('error', (err) => {
			if (err.code === 'EACCES') {
				console.error(`Error: Port ${this.config.port} requires elevated privileges. Please run with administrator rights.`)
			} else if (err.code === 'EADDRINUSE') {
				console.error(`Error: Port ${this.config.port} is already in use. Please make sure no other service is using this port.`)
			} else {
				console.error('Server error:', err)
			}
		})
	}

	restart () {
		if (!this.server) return this.init()

		this.server.close()

		console.info('Server change. Restarting...')
		this.init()
	}

	dispatch (changes) {
		const clientChanges = {}
		for (const change of changes) {
			const client = this.matchClient(change.path)
			if (!clientChanges[client.id]) clientChanges[client.id] = { client: client, changes: [] }

			clientChanges[client.id].changes.push(change)
		}

		this.commit(clientChanges)
	}

	matchClient (info, isFile = true) {
		return this.clients.find(c => isFile ? c?.matchFile(info, this) : c?.match(info, this)) || {}
	}

	getClient (id) {
		return this.clients.find(c => c.id === id) || {}
	}

	async commit (clientChanges) {
		for (const clientId in clientChanges) {
			const client = clientChanges[clientId].client
			const filesChanges = clientChanges[clientId].changes

			const log = {log: filesChanges}

			if (clientId !== 'default') this.ws.broadcast(log, conn => conn.clientId === 'default')

			const engine = client?.engine?.back

			const changes = engine?.process ? await engine.process(filesChanges, this) : [{actions: log}]

			changes.forEach(c => this.ws.broadcast(c.actions, c.filter))
		}
	}
}
