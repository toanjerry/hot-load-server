import chokidar from 'chokidar'

class FileWatcher {
	constructor (hot) {
		this.hot = hot
		this.config = hot.config.watch || {}
		this.cwd = this.config.cwd || hot.root
	}

	start () {
		this.watcher = chokidar.watch(this.config.files, this.config)
			.on('add', path => this.dispatch('add', path))
			.on('change', path => this.dispatch('change', path))
			.on('unlink', path => this.dispatch('delete', path))

		console.info(`Watching: ${this.cwd || '/'}`)

		return this
	}

	async dispatch(event, path) {
		const change = {
			event,
			path: path.replace(/\\/g, '/'),
			time: new Date().toISOString()
		}

		this.hot.dispatch([change])
	}

	stop () {
		this.watcher.close()
	}

	// Update watched patterns
	updateWatchPatterns (patterns) {
		this.config.files = patterns

		this.watcher.unwatch('**/*')
		this.watcher.add(patterns)
	}

	// Update config
	updateConfig (key, value) {
		this.config[key] = value
		this.watcher.close()
		this.start()
	}
}

export default FileWatcher
