class HotClient {
	constructor(server) {	
		this.server = server
	}

	setOpts(opts = {}) {
		this.opts = {...this.opts, ...opts};

		return this
	}

	connect() {
		try {
			this.ws = new WebSocket(this.server);
			this.setupEvent();
		} catch (err) {
			console.error(`Failed to connect: ${this.server}`, err);
			if (this.opts.reconnectInterval) {
				setTimeout(() => this.connect(), this.opts.reconnectInterval);
			}
		}
	}

	setupEvent() {
		this.ws.addEventListener('open', () => {
			this.ws.send(JSON.stringify({
				type: 'register',
				id: this.opts.id,
				url: window.location.origin,
			}));
			console.log('Hot reload connected')
		});

		this.ws.addEventListener('close', () => {
			if (this.opts.reconnectInterval) {
				setTimeout(() => this.connect(), this.opts.reconnectInterval);
			}
			console.log('Hot reload disconnected')
		});

		this.ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'change' && HMR.engine) {
				HMR.overlay()
				try {
					return HMR.engine.update(data)
				} catch (err) {
					console.error('Fail to process hot load message', err)
					return HMR.overlay(err, data)
				}
			}

			if (data.type === 'config') {
				HMR.setOpts(data.opts).init()
			} else {
				console.info(data)
			}
		});
	}
}

export default HotClient
