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
					HotEngine.process(data.changes || [])
					if (HMR.engine) {
						HMR.engine.process(data.changes || [])
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

		const script = document.createElement('script');
		script.src = `${this.server}/engine/${this.opts.engine}.js`;
		script.onload = () => {};
		script.onerror = (err) => {
			console.error(`HOT: Failed to load engine ${this.opts.engine}`, err);
		};
		document.body.appendChild(script);
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

const HotEngine = new function () {
	// actions
	this.REFRESH = 'refresh'
	this.REFRESH_X = 'refresh-x'
	this.REFRESH_JS = 'refresh-js'
	this.REFRESH_CSS = 'refresh-css'
	this.UPDATE_JS = 'update-js'
	this.UPDATE_CSS = 'update-css'
	this.UPDATE_TPL = 'update-tpl'

	this.process = (changes) => {
		for (const change of changes) {
			if (change.action === HotEngine.REFRESH) {
				return window.location.reload();
			}
			if (change.action === HotEngine.REFRESH_JS) {
				this.refreshJS(change.url, change.pattern)
			} else if (change.action === HotEngine.REFRESH_CSS) {
				this.refreshCSS(change.url, change.pattern)
			}
		}
	}

	this.create = (engine) => {
		if (!HMR) {
			return console.err('HOT: HMR isnot loaded')
		}
		HMR.engine = engine
		HMR.client.setOpts(HMR.engine.opts)

		console.log(`HOT: Engine "${engine.name || ''}" is loaded`)
	}

	this.getCSSTargets = (url, pattern) => {
		if (url) {
			url = url.split(/[\\/]/).join('/')
			pattern = null
		};

		const regexp = pattern ? new RegExp(pattern) : null
		const links = Array.from(document.getElementsByTagName('link'));

		return links.filter(link => {
			if (link.rel !== 'stylesheet' || !link.href) return false
			if (url === link.href) return true;
			return regexp ? regexp.test(link.href) : false
		});
	}

	this.getJSTargets = (url, pattern) => {
		if (url) {
			url = url.split(/[\\/]/).join('/')
			pattern = null
		}
		const regexp = pattern ? new RegExp(pattern) : null
		const scripts = Array.from(document.getElementsByTagName('script'));

		return scripts.filter(script => {
			if (!script.src) return false
			if (url === script.src) return true;
			return regexp ? regexp.test(script.src) : false
		});
	}

	this.refreshJS = (url, pattern) => {
		const targets = this.getJSTargets(url, pattern)
		if (!targets || !targets.length) return

		targets.forEach(target => {
			const newScript = document.createElement('script');
			newScript.src = target.src
			newScript.async = target.async;
			newScript.defer = target.defer;
			target.parentNode.insertBefore(newScript, target.nextSibling);
			target.parentNode.removeChild(target);
		})
	}

	this.refreshCSS = (url, pattern) => {
		const targets = this.getCSSTargets(url, pattern)
		if (!targets || !targets.length) return

		targets.forEach(target => {
			const newLink = target.cloneNode();
			newLink.href = target.href;
			target.parentNode.insertBefore(newLink, target.nextSibling);
			target.parentNode.removeChild(target);
		})
	}
}
