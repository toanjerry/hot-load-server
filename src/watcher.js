import chokidar from 'chokidar';

import {clientByPath} from '../client.config.js'

class FileWatcher {
	constructor(hot) {
		this.hot = hot;
		this.config = hot.config.watch || {};
		this.cwd = this.config.cwd || hot.root;
		this.engines = {}
	}

	start() {
		this.watcher = chokidar.watch(this.config.files, this.config)
			.on('add', path => this.dispatchChange('add', path))
			.on('change', path => this.dispatchChange('change', path))
			.on('unlink', path => this.dispatchChange('delete', path));

		console.info(`Watching for changes in: ${this.cwd || '\\'}`);

		return this;
	}

	async dispatchChange(event, path) {
		const payload = {
			type: 'change',
			event,
			path,
			time: new Date().toISOString()
		}

		if (path.startsWith(this.hot.rootFolder)) {
			if (this.hot.config.autoRestart) {
				return this.hot.restart()
			}
		}

		const engine = await this.getEngine(path)
		if (engine) {
			engine.process(payload, this.hot)
		}
	}

	async getEngine(path) {
		const clientId = clientByPath(path, this.hot)
		const clientConfig = this.hot.getClientConfig(clientId)
		const file = clientConfig.engine || clientId

		if (!this.engines[file]) {
			this.engines[file] = await import(`./engine/${file}.js`).then(mod => mod.default || mod).catch(() => null)
			console.info(`Engine "${file}" loaded`)
		}

		const engine = this.engines[file]
		if (!engine) {
			console.warn(`Cannot detect engine for file: ${path}`)
			return
		}
		if (!engine.process) {
			console.warn(`Engine ${engine.name || ''} for path ${path} miss "process" function`);
			return
		}

		return engine
	}

	stop() {
		if (this.watcher) {
			return;
		}

		this.watcher.close();
	}

	// Get watcher instance for testing or manual control
	getWatcher() {
		return this.watcher;
	}

	// Update watched patterns
	updateWatchPatterns(patterns) {
		if (!this.watcher) {
			return
		}

		this.config.files = patterns

		this.watcher.unwatch('**/*');
		this.watcher.add(patterns);
	}

	// Update config
	updateConfig(key, value) {
		if (!this.watcher) {
			return;
		}

		this.config[key] = value;
		this.watcher.close();
		this.start();
	}
}

export default FileWatcher;
