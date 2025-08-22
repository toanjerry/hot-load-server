class HotClient {
	constructor(server) {	
		this.server = server
	}

	setOpts(opts = {}) {
		this.opts = {...this.opts, ...opts}
		return this
	}

	connect() {
		try {
			this.ws = new WebSocket(this.server)
			this.setupEvent()
		} catch (err) {
			console.error(`HOT: Failed to connect ${this.server}`, err)
			if (this.opts.reconnectInterval) {
				setTimeout(() => this.connect(), this.opts.reconnectInterval)
			}
		}
	}

	setupEvent() {
		this.ws.addEventListener('open', () => {
			this.ws.send(JSON.stringify({
				type: 'register',
				info: HMR.clientInfo
			}))
			console.log('HOT: connected')
		})

		this.ws.addEventListener('close', () => {
			if (this.opts.reconnectInterval) {
				setTimeout(() => this.connect(), this.opts.reconnectInterval)
			}
			console.log('HOT: disconnected')
		})

		this.ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data)

			if (data.type === 'change') {
				HMR.overlay()
				try {
					HotEngine.process(data.actions || {})
					if (HMR.engine) {
						HMR.engine.process(data.actions || {})
					}
				} catch (err) {
					console.error('HOT: Fail to process message', err)
					HMR.overlay(err)
				}
			} else if (data.type === 'config') {
				HMR.setOpts(data.opts)
			} else {
				console.info(data)
			}
		})
	}
}

const HMR = new function () {
	this.connect = function (server) {
		this.clientInfo = {
			protocol: window.location.protocol,
			host: window.location.host,
			port: window.location.port,
			origin: window.location.origin,
		}

		this.initClient(server)
	}

	this.setOpts = function (opts) {
		this.opts = opts || {}
		if (this.opts.overlay) this.initOverlay()
	}

	this.initClient = function (server) {
		if (this.client) return

		this.client = new HotClient(server)
		this.client.setOpts({reconnectInterval: 3000}).connect()
	}

	this.overlay = function (msg = '', data, override = true) {
		if (!this.opts.overlay) {
			return overlay.style.display = 'none'
		}

		const overlay = document.getElementById('hmr-overlay')
		const content = document.getElementById('hmr-overlay-content')
		const newMsg = [msg, JSON.stringify(data)].filter(e=>e).join('\n')
		if (override) content.innerText = newMsg
		else content.innerText += '\n'+newMsg

		overlay.style.display = newMsg ? 'flex' : 'none'
	}
	
	this.initOverlay = () => {
		let overlay = document.getElementById('hmr-overlay')
		if (overlay) return

		overlay = document.createElement('div')
		overlay.id = 'hmr-overlay'
		overlay.style.position = 'fixed'
		overlay.style.top = 0
		overlay.style.left = 0
		overlay.style.width = '100vw'
		overlay.style.height = '100vh'
		overlay.style.background = 'rgba(0,0,0,0.7)'
		overlay.style.alignItems = 'center'
		overlay.style.justifyContent = 'center'
		overlay.style.zIndex = 99999
		overlay.style.display = 'none'

		const msgBox = document.createElement('div')
		msgBox.id = 'hmr-overlay-content'
		msgBox.style.background = '#fff'
		msgBox.style.overflow = 'auto'
		msgBox.style.padding = '2rem'
		msgBox.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)'
		msgBox.style.color = 'red'
		msgBox.style.width = '75%'
		msgBox.style.maxHeight = '90%'
		msgBox.style.fontSize = '20px'

		overlay.appendChild(msgBox)
		document.body.appendChild(overlay)
	}

	this.getCallStack = (from = 0) => {
		const lines = new Error().stack.split('\n')
		return lines
			.slice(1+from)
			.map(line => {
				const match = line.match(/at (\S+)/) // extract function name
				return match ? match[1] : '(anonymous)'
			})
	}

	this.assignObjectRecursive = function (o1, o2) {
		if (!o1 || !o2) return
		for (const key in o2) {
			if (!Object.prototype.hasOwnProperty.call(o2, key)) continue

			if (typeof o1[key] !== typeof o2[key]) {
				o1[key] = o2[key]
			} else if (typeof o1[key] === 'function') {
				if (o1[key].toString().trim().replaceAll(/(\s*\n\s*){2,}/g, '\n') !== o2[key].toString().trim().replaceAll(/(\s*\n\s*){2,}/g, '\n')) {
					o1[key] = o2[key]
				}
			} else if (typeof o1[key] === 'object') {
				let isPureObject = !Array.isArray(o1[key]) &&
					!(o1[key] instanceof Date) &&
					!(o1[key] instanceof RegExp) &&
					!(o1[key] instanceof Map) &&
					!(o1[key] instanceof Set) &&
					!(o1[key] instanceof WeakMap) &&
					!(o1[key] instanceof WeakSet)

				if (isPureObject) this.assignObjectRecursive(o1[key], o2[key])
			} else {
				o1[key] = o2[key]
			}
		}
	}

	this.isEqual = function(o1, o2) {
		if (o1 === o2) return true
		if (typeof o1 !== typeof o2) return false

		const keys1 = Object.keys(o1)
		const keys2 = Object.keys(o2)

		if (keys1.length !== keys2.length) return false

		for (const key of keys1) {
			if (!keys2.includes(key)) return false
			if (!this.isEqual(o1[key], o2[key])) return false
		}

		return true
	}
}

const HotEngine = new function () {
	// actions
	this.RELOAD = 'reload'
	this.AJAX = 'ajax'
	this.RELOAD_JS = 'reload-js'
	this.RELOAD_CSS = 'reload-css'
	this.UPDATE_JS = 'update-js'
	this.UPDATE_CSS = 'update-css'
	this.UPDATE_TPL = 'update-tpl'

	this.process = (changes) => {
		if (changes[HotEngine.RELOAD]) return window.location.reload()

		if (changes[HotEngine.RELOAD_JS]) {
			this.reloadJS(changes[HotEngine.RELOAD_JS])
		}
		if (changes[HotEngine.RELOAD_CSS]) {
			this.reloadCSS(changes[HotEngine.RELOAD_CSS])
		}
	}

	this.load = (engine) => {
		HMR.engine = engine
		HMR.client.setOpts(HMR.engine.opts)

		if (HMR.engine.init) HMR.engine.init()

		console.log(`Engine: "${engine.name || ''}" is inited`)
	}

	this.getCSSTargets = (url, pattern) => {
		if (url) {
			url = url.split(/[\\/]/).join('/')
			pattern = null
		}

		const regexp = pattern ? new RegExp(pattern) : null
		const links = Array.from(document.getElementsByTagName('link'))

		return links.filter(l => l.rel === 'stylesheet' && (url === l.href || (regexp && regexp.test(l.href))))
	}

	this.getJSTargets = (url, pattern) => {
		if (url) {
			url = url.split(/[\\/]/).join('/')
			pattern = null
		}
		const regexp = pattern ? new RegExp(pattern) : null
		const scripts = Array.from(document.getElementsByTagName('script'))

		return scripts.filter(s => url === s.src || (regexp && regexp.test(s.src)))
	}

	this.reloadJS = (changes) => {
		const scripts = new Set()
		changes.forEach(c => {
			const targets = this.getJSTargets(c.url, c.pattern)
			for (const t of targets) {
				if (!scripts.has(t)) scripts.add(t)
			}
		})
		
		if (!scripts || !scripts.size) return

		scripts.forEach(target => {
			const newScript = document.createElement('script')
			newScript.src = target.src
			newScript.async = target.async
			newScript.defer = target.defer
			target.parentNode.insertBefore(newScript, target.nextSibling)
			target.parentNode.removeChild(target)
		})
	}

	this.reloadCSS = (changes) => {
		const links = new Set()
		changes.forEach(c => {
			const targets = this.getCSSTargets(c.url, c.pattern)
			for (const t of targets) {
				if (!links.has(t)) links.add(t)
			}
		})

		links.forEach(target => {
			const newLink = target.cloneNode()
			newLink.href = target.href
			target.parentNode.insertBefore(newLink, target.nextSibling)
			target.parentNode.removeChild(target)
		})
	}
}
