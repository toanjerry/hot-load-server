import path from 'path'

import { existsSync, mkdirSync } from 'fs'

import { injectScript, rewriteContent, getContent, removeScript } from './util/file.js'
import { minimizeCode } from './util/index.js'

export default class ClientInjecter {
	constructor (hot) {
		this.hot = hot
		this.root = this.hot.root
		this.entries = []

		this.bundleDir = path.resolve(import.meta.dirname, '../public/bundle')
		if (!existsSync(this.bundleDir)) mkdirSync(this.bundleDir, { recursive: true })
	}

	async inject () {
		const code_path = path.resolve(import.meta.dirname, '../public/js/client.js')
		const code = `${getContent(code_path)}\nHMR.connect('${this.hot.config.protocol}://${this.hot.config.host}:${this.hot.config.port}')`
		const code_min = await minimizeCode(code)

		// inject JS code to client entry
		for (const client of this.hot.clients) {
			let js = client?.inject?.minimize ? code_min : code
			js += `\n${this.#getEngineJS(client?.engine?.front)}`
			
			if (typeof client.entryPoints === 'string') {
				client.entryPoints = [client.entryPoints]
			} else if (typeof client.entryPoints === 'function') {
				client.entryPoints = client.entryPoints(client, this.hot)
			}

			if (!client.entryPoints || !client.entryPoints.length) {
				rewriteContent(`${this.bundleDir}/${client.id}.js`, js, false)
				continue
			}

			// inject js code to each entry point
			client.entryPoints.forEach(entry => {
				console.log(`Inject: ${client.id} - ${entry}`)
				entry = path.join(this.root, entry)

				if (entry.endsWith('.html')) {
					injectScript(entry, `<script>${content}</script>`)
				} else {
					injectScript(entry, js)
				}

				this.entries.push(entry)
			})
		}
	}

	remove () {
		this.entries.forEach(file => removeScript(file))

		console.log('Inject: removed all')

		return this.entries
	}

	#getEngineJS (engine) {
		if (!engine) return ''

		const isPath = /\.(js|ts|jsx|tsx)$/.test(engine)
		if (isPath) {
			const frontPath = path.isAbsolute(engine) ? engine : path.join(this.root, engine)

			return getContent(frontPath)
		}

		return engine
	}
}
