export default {
	default: {
		overlay: true, //show error on client
		entryPoints: './public/index.html', // file inject code init hot reload
		engine: 'default', // engine for resolve hot load file in server(/src/engine) and client(/public/engine)
		inject: {
			combine: false, // set true will combine all code hot load (client.js, engine) and inject to entry point, use when client cannot load file js from hot load server cuz of Content-Security-Policy
			minimize: true // minimize js, css
		}
	},
	base: {
		overlay: true,
		entryPoints: [
			// hrm
			'../../data/base/hrm.cache/tcache/a.js.45201d9b0ba7c4521973d136efdd23d5d0426a117efd68cf282128df57077f6evi.cch',
			'../../data/base/hrm.cache/tcache/a.js.45201d9b0ba7c4521973d136efdd23d5d0426a117efd68cf282128df57077f6een.cch',
		],
		engine: 'base',
		inject: {
			combine: true,
			minimize: true
		}
	}
}

export function clientByPath (path, hot) {
	var app = path.split(/[\\/]/)[0]

	return app === hot.rootFolder ? 'default' : 'base';
}

export function clientByHost (host) {
	return host.endsWith('base.beta') ? 'base' : 'default';
}