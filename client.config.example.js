export default {
	default: {
		overlay: true, //show error on client
		entryPoint: './public/index.html', // file inject code init hot reload
		engine: 'default', // engine for resolve hot load file in server(/src/engine) and client(/public/engine)
		injectCombine: false, // set true will combine all code hot load (init, client, engine) and inject to entry point, use when client cannot load file js from hot load server cuz of CPS policy
	},
	base: {
		overlay: true,
		// entryPoint: '../data/base/{app}.cache/tcache/a.js.cch',
		engine: 'base',
		injectCombine: true
	}
}

export function clientByPath (path, hot) {
	var app = path.split(/[\\/]/)[0]

	return app === hot.rootFolder ? 'default' : 'base';
}

export function clientByHost (host) {
	return host.endsWith('base.beta') ? 'base' : 'default';
}