import express from 'express';
import cors from 'cors';
import https from 'https';

import { Routes } from './routes.js';

import SocketServer from './socket.js';
import FileWatcher from './watcher.js';
import path from 'path';
import {appendContent, injectScript, rewriteContent, minimizeContent} from './helper/file.js'
import {isOriginAllowed} from './helper/index.js'

class HotServer {
	constructor(config) {
		this.config = config;
		this.domain = `${config.host}:${config.port}`
		this.url = `${config.protocol}://${this.domain}`
		this.root = process.cwd()
		this.rootFolder = path.basename(this.root);
	
		this.init()
	}

	init () {
		this.initServer()
		
		this.ws = new SocketServer(this);
		this.watch = new FileWatcher(this).start();
	}

	getCors() {
		const config = this.config
		const domains = config.domains || [];
		domains.push(this.domain);
		
		return {
			origin: (origin, callback) => {
				// Always allow requests from our local development server
				if (origin === 'https://localhost:3000' || origin === 'https://127.0.0.1:3000') {
					return callback(null, true);
				}
				
				// Allow null origin (like direct file access or Postman)
				if (!origin) {
					return callback(null, true);
				}

				// Check if the origin matches our allowed domains
				if (isOriginAllowed(origin, domains)) {
					return callback(null, true);
				}
		
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

		// Serve static files with proper MIME types
		app.use('/hot', express.static('public/hot', {
			setHeaders: (res, path) => {
				if (path.endsWith('.js')) {
					res.setHeader('Content-Type', 'application/javascript');
				}
			}
		}));

		this.server = https.createServer(this.config.ssl, app);

		Routes(app, this);

		this.server.listen(this.config.port, this.config.host, () => {
			console.info(`Server is running on ${this.url}`);
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

	getClientConfig(client_id) {
		return this.config?.clients[client_id] || {}
	}

	injectClient(minimize = true) {
		const filePath = {
			client: path.join(this.root, 'public', 'inject', 'client.js'),
			index: path.join(this.root, 'public', 'inject', 'index.js'),
		}

		// build file index.js
		rewriteContent(filePath.index, filePath.client)
		appendContent(filePath.index, `HMR.connect('${this.config.host}',${this.config.port})`, false)
		if (minimize) {
			minimizeContent(filePath.index)
		}

		// inject JS code to client entry
		for (const clientId in this.config.clients || {}) {
			const config = this.config.clients[clientId]
			let entry = config.entryPoint
			if (!entry) {
				continue
			}
			entry = path.join(this.root, entry);

			if (config.injectCombine) {
				// cache engine file path
				if (config.engine && !filePath[config.engine]) {
					filePath[config.engine] = path.join(this.root, 'public', 'engine', `${config.engine}.js`)
				}

				// inject all js to end file entry
				['index', config.engine].every(f => appendContent(entry, filePath[f]))
			} else {
				if (entry.endsWith('.html')) {
					injectScript(entry, `<script src="/inject/index.js" defer async></script>`)
				} else {
					appendContent(entry, filePath.index)
				}
			}
		}
	}
}

export default HotServer
