import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import path from 'path';

import { Routes } from './routes.js';

import SocketServer from './socket.js';
import FileWatcher from './watcher.js';
import {isOriginAllowed} from './helper/index.js';

import ClientInjecter from './injecter.js';

import DefaultClient from './default/client.js'

class HotServer {
	constructor(config) {
		this.config = config;
		this.domain = `${config.host}:${config.port}`
		this.url = `${config.protocol}://${this.domain}`
		this.root = process.cwd()
		this.rootFolder = path.basename(this.root);
		this.plugins = config.plugins || [];
		this.clients = [DefaultClient, ...config.clients || []]
	}

	init () {
		this.initServer()
		
		this.ws = new SocketServer(this);
		this.watch = new FileWatcher(this).start();

		this.plugins.forEach(plugin => {
			if (plugin.configureServer) {
				plugin.configureServer(this)
			}
			console.info(`Plugin: loaded "${plugin.name || ''}"`)
		});

		this.injecter = new ClientInjecter(this)
		this.injecter.remove()
		this.injecter.inject()

		this.clients.forEach(client => client?.engine?.back?.init && client.engine.back.init(this))
	}

	getCors() {
		const config = this.config
		const domains = config.domains || [];
		domains.push(this.domain);
		
		return {
			origin: (origin, cb) => {
				if (!origin) return cb(null, true);

				// Check if the origin matches our allowed domains
				if (isOriginAllowed(origin, domains)) return cb(null, true);
		
				callback(new Error(`Not allowed by CORS - Only ${domains.join(', ')} are allowed`));
			},
			methods: ['GET', 'POST', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization'],
			credentials: true
		}
	}

	initServer() {
		const app = express();
		const corsOpts = this.getCors();
		app.use(cors(corsOpts));
		// Add security headers middleware
		app.use((req, res, next) => {
			// Add security headers
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
			res.setHeader('Access-Control-Allow-Credentials', 'true');
			res.setHeader('X-Content-Type-Options', 'nosniff');
			next();
		});

		if (this.config.protocol === 'https') {
			this.server = https.createServer(this.config.ssl, app);
		} else {
			this.server = http.createServer(app);
		}

		Routes(app, this);

		this.server.listen(this.config.port, this.config.host, () => {
			console.info('----------------------------------------------');
			console.info(`Server is running on: ${this.url}`);
			console.info('Reload app to connect');
			console.info('----------------------------------------------');
		}).on('error', (err) => {
			if (err.code === 'EACCES') {
				console.error(`Error: Port ${this.config.port} requires elevated privileges. Please run with administrator rights.`);
			} else if (err.code === 'EADDRINUSE') {
				console.error(`Error: Port ${this.config.port} is already in use. Please make sure no other service is using this port.`);
			} else {
				console.error('Server error:', err);
			}
		});
	}

	restart() {
		if (!this.server) {
			return this.init()
		}

		this.server.close();

		console.info('Server change. Restarting...');
		this.init()
	}

	dispatch(changes) {
		const data = {}
		for (const change of changes) {
			if (change.path.startsWith(`${this.rootFolder}/src`)) {
				if (this.config.autoRestart) {
					return this.restart()
				}
			}
			const clientId = this.matchClient(change.path).id || 'default'
			if (!data[clientId]) {
				data[clientId] = []
			}

			data[clientId].push(change)
		}

		this.commit(data)
	}

	matchClient (info, isFile = true) {
		return this.clients.find(c => isFile ? c?.matchFile(info, this) : c?.match(info, this)) || {}
	}

	getClient (id) {
		return this.clients.find(c => c.id === id) || {}
	}

	async commit(clientChanges) {
		for (const clientId in clientChanges) {
			const changes = []

			const client = this.getClient(clientId)
			const engine = client?.engine?.back
			if (engine?.process) {
				changes.push(...await engine.process(clientChanges[clientId], this))
			}

			if (!changes.length) {
				changes.push({changes: {log: clientChanges[clientId]}, filter: info => info.app === 'hot'})
			}
				
			this.ws.broadcast(changes)
		}
	}
}

export default HotServer
