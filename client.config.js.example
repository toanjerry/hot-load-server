export default [
	// 	id: 'default',
	// 	overlay: true, // show error on client
	// 	entryPoints: './public/index.html', // file inject code init hot reload
	// 	engine: 'default', // engine for resolve hot load file in server(/src/engine) and client(/public/engine)
	// 	inject: { // config for injecting js to client
	// 		combine: true, // set true will combine all code hot load (client.js, engine) and inject to entry point, use when client cannot load file js from hot load server cuz of Content-Security-Policy
	// 		minimize: true // minimize js, css
	// 	},
	// 	matchFile: (path, hot) => path.split('/')[0] === hot.rootFolder, // matching checker for file
	// 	match: (info, hot) => info.app === 'hot' // matching checker for socket client
	{
		id: 'base',
		overlay: true,
		engine: 'base',
		inject: {
			combine: true,
			minimize: true,
		},
		apps: ['hrm'], // add app here
		entryPoints: (client) => {
			const apps = client.apps || []
			const files = [
				'a.js.45201d9b0ba7c4521973d136efdd23d5d0426a117efd68cf282128df57077f6evi.cch',
				'a.js.45201d9b0ba7c4521973d136efdd23d5d0426a117efd68cf282128df57077f6een.cch'
			];
			return apps.flatMap(app => files.map(f => `../../data/base/${app}.cache/tcache/${f}`));
		},
		matchFile: (path, hot) => path.split('/')[0] !== hot.rootFolder,
		match: (info, hot) => info.domain === 'base.beta'
	}
]
