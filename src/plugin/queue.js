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

		return this.process(items)
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
