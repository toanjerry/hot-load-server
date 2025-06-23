import fs from 'fs';

class HMRQueue {
	constructor(opts = {}) {
		this.queue = []
		this.processing = false
		this.debounceTime = opts.debounceTime || 150
		this.process = opts.process || (() => console.log('Queue processing...'))
	}

	async add(item) {
		if (Array.isArray(item)) {
			this.queue.push(...item)
		} else {
			this.queue.push(item)
		}
		
		if (!this.processing) {
			this.processing = true
			await this.debounce()
			await this.processQueue()
			this.processing = false
		}
	}

	async debounce() {
		return new Promise(resolve =>
			setTimeout(resolve, this.debounceTime)
		)
	}

	async processQueue() {
		if (this.queue.length === 0) return

		const items = [...this.queue]
		this.queue = []

		console.log(items)

		return this.process(items)

		// Batch processing
		const batched = this.batchUpdates(updates)

		await Promise.all(Object.keys(batched).map(key => {
			if (key === 'js') {
				return this.processJS(batched[key])
			} else if (key === 'css') {
				return this.processCSS(batched[key])
			} else if (key === 'base') {
				return this.processTemplate(batched[key])
			}
		}))

		console.log(batched)

		if (this.send) {
			this.send(batched);
		}
	}

	batchUpdates(updates) {
		// Group updates by type hoặc directory
		const batches = {}

		updates.forEach(update => {
			const key = this.getBatchKey(update)
			if (!batches[key]) {
				batches[key] = [];
			}

			batches[key].push(update)
		})

		return batches
	}

	getBatchKey(update) {
		let file = update.file;
		if (!file) {
			return '';
		}

		if (file.endsWith('.js')) {
			return 'js'
		} if (file.endsWith('.css')) {
			return 'css'
		} if (file.endsWith('.base') || file.endsWith('.tpl')) {
			return 'base'
		} if (file.endsWith('.lng')) {
			return 'lng'
		}

		return '';
	}

	async processJS(updates) {
		let files = updates.map((u) => u.file)

		let rs = {err: 0, msg: ''} // await this.runCmd(`php -v ${files.join(' ')}`);

		console.log(rs)

		if (rs.err) {
			console.log(rs.msg)
			return;
		}

		let src_map = rs.msg;

		updates.map(update => {
			update.processed = src_map[update.file] || update.file;
			if (update.processed) {
				try {
					update.src = fs.readFileSync(update.processed, 'utf8');
				} catch (e) {
					console.error(`Failed to read file ${update.processed}:`, e);
				}
			}
		})
	}

	async runCmd (cmd) {
		const { exec } = await import('child_process');

		try {
			return await new Promise((resolve) => {
				exec(cmd, (error, stdout, stderr) => {
					if (error) {
						resolve({ error: 1, msg: error.message });
						return;
					}
					if (stderr) {
						console.error(`PHP stderr: ${stderr}`);
					}

					resolve({ error: 0, msg: stdout });
				});
			});
		} catch (e) {
			return { error: 1, msg: e }
		}
	}
}

function QueuePlugin() {
	return {
		name: 'hmr-queue',
		configureServer(server) {
			const originalDispatch = server.dispatch

			const queue = new HMRQueue({
				debounceTime: 150,
				process: originalDispatch.bind(server)
			})
			server.dispatch = function (changes) {
				queue.add(changes)
			}
		}
	}
}

export default QueuePlugin
