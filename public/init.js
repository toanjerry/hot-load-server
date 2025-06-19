(async () => {
	const HMR = {
		server: {
			port: 3000,
			host: 'localhost',
		},
		src: window.Client && window.Client.domain === 'base.beta' ? 'base.js' : 'default.js',
	}
	HMR.url = `${window.location.protocol}//${HMR.server.host}:${HMR.server.port}`

	const clientModule = await import(`${HMR.url}/client.js`).catch(() => import('./client.js'));
	window.HotReload = clientModule.default;

	HMR.loadEngine = () => {
		const script = document.createElement('script')
		script.defer = true
		script.src = `${HMR.url}/hot/${HMR.src}`
		script.type = 'text/javascript'
		
		document.head.appendChild(script)
	}
	
	HMR.loadEngine()

	window.HMR = HMR
})();
