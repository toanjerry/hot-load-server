import path from 'path';

import { existsSync, mkdirSync } from 'fs';
import {appendContent, injectScript, rewriteContent, minimizeContent, getContent, removeScript} from './helper/file.js'

export default class ClientInjecter {
	constructor (hot) {
		this.hot = hot
		this.clients = this.hot.config.clients || []
		this.root = this.hot.root

		this.initFolders()

		this.files = {
			client: {
				path: path.join(this.root, 'public', 'js', 'client.js'),
				url: '/inject/client.js'
			},
			index: {
				path: path.join(this.bundleDir, 'index.js'),
				url: '/bundle/index.js'
			},
			index_min: {
				path: path.join(this.bundleDir, 'index.min.js'),
				url: '/bundle/index.min.js'
			},
		}
	}

	initFolders () {
		this.cacheDir = path.join(this.root, 'cache');
		if (!existsSync(this.cacheDir)) {
			mkdirSync(this.cacheDir, { recursive: true });
		}

		this.bundleDir = path.join(this.root, 'public', 'bundle')
		if (!existsSync(this.bundleDir)) {
			mkdirSync(this.bundleDir, { recursive: true });
		}
	}

	async inject() {
		await this.#bundle()

		this.#getInjected().forEach(file => {
			removeScript(file)
		});

		const injectEntries = []
		// inject JS code to client entry
		for (const client of this.clients || []) {
			if (client.id === 'default' || !client.entryPoints) continue
			
			if (typeof client.entryPoints === 'string') {
				client.entryPoints = [client.entryPoints]
			} else if (typeof client.entryPoints === 'function') {
				client.entryPoints = client.entryPoints(client)
			}

			// get files inject
			let filesInject = [client?.inject?.minimize ? 'index_min' : 'index']
			if (client.engine) {
				// cache engine file path
				if (client.engine && !this.files[client.engine]) {
					this.files[client.engine] = { path: path.join(this.root, 'public', 'engine', `${client.engine}.js`) }
				}
				// add engine file to combine
				if (client?.inject?.combine) {
					filesInject.push(client.engine)
				}
			}
			
			// inject code to each entry point
			client.entryPoints.forEach(entry => {
				console.log(`injected: ${client.id} - ${entry}`)
				entry = path.join(this.root, entry);

				if (client?.inject?.combine) {
					let content = ''

					filesInject.forEach(f => {
						content += '\n'+getContent(this.files[f].path)
					})
	
					if (entry.endsWith('.html')) {
						injectScript(entry, `<script>${content}</script>`)
					} else {
						injectScript(entry, content)
					}
				} else {
					filesInject.forEach(f => {
						if (entry.endsWith('.html')) {
							injectScript(entry, `<script src="${this.files[f].url}" defer async></script>`)
						} else {
							injectScript(entry, this.files[f].path, true)
						}
					})
				}

				injectEntries.push(entry)
			})
		}

		this.#cacheInjected(injectEntries)
	}

	remove () {
		const entries = this.#getInjected()
		entries.forEach(file => {
			removeScript(file)
		});

		this.#cacheInjected([])

		console.log('removed injections')

		return entries
	}

	async #bundle () {
		// build file index.js
		rewriteContent(this.files.index.path, this.files.client.path)
		appendContent(this.files.index.path, `HMR.connect('${this.hot.config.host}',${this.hot.config.port})`, false)

		// build file index.min.js
		rewriteContent(this.files.index_min.path, this.files.index.path)
		await minimizeContent(this.files.index_min.path)
	}

	#getInjected () {
		const files = getContent(path.join(this.cacheDir, '.injected'))

		return files.split("\n")
	}

	#cacheInjected(files) {
		rewriteContent(path.join(this.cacheDir, '.injected'), files.join("\n"), false)
	}
}