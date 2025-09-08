// import fs from 'fs'

import QueuePlugin from '../plugin/queue.js'

export default {
	host: 'localhost',
	port: '3000',
	protocol: 'http',
	// cors
	domains: [],
	credentials: true,
	// ssl: {
	// 	key: fs.readFileSync('./ssl.key'),
	// 	cert: fs.readFileSync('./ssl.crt'),
	// 	// ca: fs.readFileSync('./ssl.ca.crt')
	// },
	watch: {
		cwd: process.cwd(),
		files: ['**/*.js', '**/*.css', '**/*.html'],
		ignored: [
			// common folder
			'**/node_modules/**',
			'**/.git/**',
			'**/dist/**',
			'**/build/**'
		],
		persistent: true,
		ignoreInitial: true,
	},
	plugins: [ QueuePlugin() ],
	clients: [],
}
