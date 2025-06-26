import chokidar from 'chokidar';

class FileWatcher {
	constructor(hot) {
		this.hot = hot;
		this.config = hot.config.watch || {};
		this.cwd = this.config.cwd || hot.root;
	}

	start() {
		this.watcher = chokidar.watch(this.config.files, this.config)
			.on('add', path => this.dispatch('add', path))
			.on('change', path => this.dispatch('change', path))
			.on('unlink', path => this.dispatch('delete', path));

		console.info(`Watching for changes in: ${this.cwd || '\\'}`);

		return this;
	}

	async dispatch(event, path) {
		if (this.hot.pause) return
		const change = {
			event,
			path,
			time: new Date().toISOString()
		}

		this.hot.dispatch([change])
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
