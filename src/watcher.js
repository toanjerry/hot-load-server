import chokidar from 'chokidar';

class FileWatcher {
	constructor(config, hot) {
		this.config = config;
		this.cwd = config.cwd || process.cwd();
		this.hot = hot;
		this.resolver = this.config.resolver || null
		if (!this.resolver) {
			return console.warn(`Missing resolver`);
		}
		if (!this.resolver.process) {
			return console.warn(`Resolver ${this.resolver.name || ''} miss "process" function`);
		}
	}

	start() {
		this.watcher = chokidar.watch(this.config.files, this.config)
			.on('add', path => this.dispatchChange('add', path))
			.on('change', path => this.dispatchChange('change', path))
			.on('unlink', path => this.dispatchChange('delete', path));

		console.info(`Watching for changes in: ${this.config.cwd || '\\'}`);

		return this;
	}

	dispatchChange(event, path) {
		const payload = {
			type: 'change',
			event,
			path,
			// time: new Date().toISOString()
		}

		if (path.startsWith('hot-load')) {
			if (this.hot.config.autoRestart) {
				return this.hot.restart()
			}

			console.log(payload)
			return;
		}
		
		this.resolver.process(payload, this.hot)
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
