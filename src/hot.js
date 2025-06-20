import express from 'express';
import cors from 'cors';
import https from 'https';

import { Routes } from './routes.js';

import SocketServer from './socket.js';
import FileWatcher from './watcher.js';
import path from 'path';
import {appendContent, injectScript, rewriteContent, minimizeContent, getContent} from './helper/file.js'
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

	injectClient() {
		const filePath = {
			client: {
				path: path.join(this.root, 'public', 'js', 'client.js'),
				url: '/inject/client.js'
			},
			index: {
				path: path.join(this.root, 'public', 'bundle', 'index.js'),
				url: '/bundle/index.js'
			},
			index_min: {
				path: path.join(this.root, 'public', 'bundle', 'index.min.js'),
				url: '/bundle/index.min.js'
			},
		}

		// build file index.js
		rewriteContent(filePath.index.path, filePath.client.path)
		appendContent(filePath.index.path, `HMR.connect('${this.config.host}',${this.config.port})`, false)

		// build file index.min.js
		rewriteContent(filePath.index_min.path, filePath.index.path)
		minimizeContent(filePath.index_min.path)

		// inject JS code to client entry
		for (const clientId in this.config.clients || {}) {
			const config = this.config.clients[clientId]
			// get all entry points
			let entryPoints = config.entryPoints || ''
			if (!entryPoints.length) {
				continue
			}
			if (typeof 'entryPoints' === 'string') {
				entryPoints = [entryPoints]
			}

			// get files inject
			let files_inject = []
			if (config?.inject?.minimize) {
				files_inject.push('index_min')
			} else {
				files_inject.push('index')
			}

			if (config.engine) {
				// cache engine file path
				if (config.engine && !filePath[config.engine]) {
					filePath[config.engine] = { path: path.join(this.root, 'public', 'engine', `${config.engine}.js`) }
				}
				// add engine file to combine
				if (config?.inject?.combine) {
					files_inject.push(config.engine)
				}
			}

			console.log(files_inject)
			
			// inject code to each entry point
			entryPoints.forEach(entry => {
				entry = path.join(this.root, entry);

				if (config?.inject?.combine) {
					let content = ''
					// Try to append each file, break if appendContent returns false
					files_inject.forEach(f => {
						content += '\n'+getContent(filePath[f].path)
					})
	
					if (entry.endsWith('.html')) {
						injectScript(entry, `<script>${content}</script>`)
					} else {
						appendContent(entry, content)
					}
				} else {
					files_inject.forEach(f => {
						if (entry.endsWith('.html')) {
							injectScript(entry, `<script src="${filePath[f].url}" defer async></script>`)
						} else {
							appendContent(entry, filePath[f].path)
						}
					})
				}
			})

		}
	}
}

export default HotServer
