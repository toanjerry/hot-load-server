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
			console.error(`HOT: Failed to connect ${this.server}`, err);
			if (this.opts.reconnectInterval) {
				setTimeout(() => this.connect(), this.opts.reconnectInterval);
			}
		}
	}

	setupEvent() {
		this.ws.addEventListener('open', () => {
			this.ws.send(JSON.stringify({
				type: 'register',
				app: HMR.location.app,
				origin: HMR.location.origin,
				domain: HMR.location.domain,
			}));
			console.log('HOT: connected')
		});

		this.ws.addEventListener('close', () => {
			if (this.opts.reconnectInterval) {
				setTimeout(() => this.connect(), this.opts.reconnectInterval);
			}
			console.log('HOT: disconnected')
		});

		this.ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'change') {
				HMR.overlay()
				try {
					HotEngine.update(data)
					if (HMR.engine) {
						HMR.engine.process(data)
					}
				} catch (err) {
					console.error('HOT: Fail to process message', err)
					HMR.overlay(err, data)
				}
			} else if (data.type === 'config') {
				HMR.setOpts(data.opts).init()
			} else {
				console.info(data)
			}
		});
	}
}

const HotEngine = new function () {
	this.update = (change) => {
		if (change.action === 'refresh') {
			return window.location.reload();
		}
		if (change.action === 'refresh-js') {
			refreshJS(change.path)
		} else if (change.action === 'refresh-css') {
			refreshCSS(change.path)
		}
	}

	function refreshJS (path) {
		if (!path) return
		path = path.split(/[\\/]/).join('/')

		const scripts = Array.from(document.getElementsByTagName('script'));
		const target = scripts.find(script => {
			if (!script.src) {
				return false;
			}
			const url = new URL(script.src);
			return path.endsWith(url.pathname)
		});

		if (target) {
			const newScript = document.createElement('script');
			newScript.src = target.src
			newScript.async = target.async;
			newScript.defer = target.defer;
			target.parentNode.insertBefore(newScript, target.nextSibling);
			target.parentNode.removeChild(target);
		}		
	}

	function refreshCSS (path) {
		if (!path) return;
		path = path.split(/[\\/]/).join('/')

		const links = Array.from(document.getElementsByTagName('link'));
		const target = links.find(link => {
			if (link.rel !== 'stylesheet' || !link.href) {
				return false;
			}
			const url = new URL(link.href);
			return path.endsWith(url.pathname)
		});

		if (target) {
			const newLink = target.cloneNode();
			newLink.href = target.href.split('?')[0] + '?t=' + Date.now();
			target.parentNode.insertBefore(newLink, target.nextSibling);
			target.parentNode.removeChild(target);
		}
	}
}

const HMR = new function () {
	this.connect = async function (host, port) {
		this.detectLocation()
		this.server = `${this.location.protocol}//${host}:${port}`
		this.initClient()
	}

	this.setOpts = function (opts) {
		this.opts = opts || {}

		return this
	}

	this.initClient = async function () {
		if (this.client) return

		this.client = new HotClient(this.server)
		this.client.setOpts({reconnectInterval: 3000}).connect()
	}

	this.init = () => {
		this.initEngine()
		if (this.opts.overlay) {
			this.initOverlay()
		}
	}

	this.initEngine = async function (force = false) {
		if (this.engine && !force) {
			return;
		}

		if (!this.opts?.engine) {
			this.opts.engine = 'default'
		}

		if (!window.ClientEngine) {
			const engine = await import(`${this.server}/engine/${this.opts.engine}.js`)
			if (!engine) {
				console.error('HOT: error load engine')
			}
	
			window.ClientEngine = engine.default;
		}
		
		this.engine = new ClientEngine()
		this.client.setOpts(this.engine.opts)

		console.log(`HOT: ${this.engine.constructor.name || ''} is inited`)
	}

	this.detectLocation = () => {
		this.location = {
			app: window?.Client?.base?.app || 'hot',
			domain: window?.Client?.domain || window.location.host,
			protocol: window.location.protocol,
			host: window.location.host,
			port: window.location.port,
			origin: window.location.origin,
		}
	}

	this.overlay = function (msg = '', data) {
		if (!this.opts.overlay) {
			return
		}

		const overlay = document.getElementById('hmr-overlay');
		if (msg) {
			delete data.js
			delete data.css
			document.getElementById('hmr-overlay-content').innerText = msg+'\n'+JSON.stringify(data)
			overlay.style.display = 'flex';
		} else {
			overlay.style.display = 'none';
		}
	}
	
	this.initOverlay = () => {
		let overlay = document.getElementById('hmr-overlay');
		if (overlay) return

		overlay = document.createElement('div');
		overlay.id = 'hmr-overlay';
		overlay.style.position = 'fixed';
		overlay.style.top = 0;
		overlay.style.left = 0;
		overlay.style.width = '100vw';
		overlay.style.height = '100vh';
		overlay.style.background = 'rgba(0,0,0,0.7)';
		overlay.style.alignItems = 'center';
		overlay.style.justifyContent = 'center';
		overlay.style.zIndex = 99999;
		overlay.style.display = 'none';

		const msgBox = document.createElement('div');
		msgBox.id = 'hmr-overlay-content';
		msgBox.style.background = '#fff';
		msgBox.style.padding = '2rem';
		msgBox.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
		msgBox.style.color = 'red';

		overlay.appendChild(msgBox);
		document.body.appendChild(overlay);
	}
};
HMR.connect('localhost',3000)