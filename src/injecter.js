import path from 'path';

import { existsSync, mkdirSync } from 'fs';
import {appendContent, injectScript, rewriteContent, minimizeContent, getContent, removeScript} from './helper/file.js'

export default class ClientInjecter {
	constructor (hot) {
		this.hot = hot
		this.root = this.hot.root
		this.entries = []

		this.initFolders()

		this.files = {
			client: {
				path: path.join(this.root, 'public/js/client.js'),
				url: '/js/client.js'
			},
			hot: {
				path: path.join(this.bundleDir, 'hot.js'),
				url: '/bundle/hot.js'
			},
			hot_min: {
				path: path.join(this.bundleDir, 'hot.min.js'),
				url: '/bundle/hot.min.js'
			},
		}
	}

	initFolders () {
		this.bundleDir = path.join(this.root, 'public', 'bundle')
		if (!existsSync(this.bundleDir)) {
			mkdirSync(this.bundleDir, { recursive: true });
		}
	}

	async inject() {
		await this.#bundle()

		// inject JS code to client entry
		for (const client of this.hot.clients) {
			if (client.id === 'default' || !client.entryPoints) continue
			
			if (typeof client.entryPoints === 'string') {
				client.entryPoints = [client.entryPoints]
			} else if (typeof client.entryPoints === 'function') {
				client.entryPoints = client.entryPoints(client, this.hot)
			}

			// get files inject
			let filesInject = [client?.inject?.minimize ? 'hot_min' : 'hot']
			let engine = client?.engine?.front || '';
			console.log("engine path: ", client.engine)
			
			// inject code to each entry point
			client.entryPoints.forEach(entry => {
				console.log(`Inject: ${client.id} - ${entry}`)
				entry = path.join(this.root, entry);

				let content = ''
				filesInject.forEach(f => {
					content += '\n'+getContent(this.files[f].path)
				})

				content += `\n${engine}`;

				if (entry.endsWith('.html')) {
					injectScript(entry, `<script>${content}</script>`)
				} else {
					injectScript(entry, content)
				}

				this.entries.push(entry)
			})
		}
	}

	remove () {
		this.entries.forEach(file => removeScript(file));

		console.log('Inject: removed all')

		return this.entries
	}

	async #bundle () {
		// build file index.js
		rewriteContent(this.files.hot.path, this.files.client.path)
		appendContent(this.files.hot.path, `HMR.connect('${this.hot.config.protocol}://${this.hot.config.host}:${this.hot.config.port}')`, false)

		// build file index.min.js
		rewriteContent(this.files.hot_min.path, this.files.hot.path)
		await minimizeContent(this.files.hot_min.path)
	}
}
