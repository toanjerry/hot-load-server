export default {
	default: {
		overlay: true, //show error on client
		entryPoint: './public/index.html', // file inject code init hot reload
		engine: 'default', // engine for resolve hot load file in server(/src/engine) and client(/public/engine)
	},
	base: {
		overlay: true,
		entryPoint: '../data/base/{app}.cache/tcache/a.js.cch',
		engine: 'base',
	}
}

export function clientByPath (path, hot) {
	var app = path.split(/[\\/]/)[0]

	return app === hot.rootFolder ? 'default' : 'base';
}

export function clientByHost (host) {
	return host.endsWith('base.beta') ? 'base' : 'default';
}