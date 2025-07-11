import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import ClientConfig from './client.config.js'

import QueuePlugin from './src/plugin/queue.js'

dotenv.config();

const config = {
	host: process.env.HOST || 'localhost',
	port: process.env.PORT || '3000',
	protocol: process.env.PROTOCOL || 'http',
	autoRestart: false,
	// cors
	domains: process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',') : null,
	credentials: true,
	// ssl
	ssl: {
		key: process.env.SSL_KEY_PATH ? fs.readFileSync(process.env.SSL_KEY_PATH) : null,
		cert: process.env.SSL_CERT_PATH ? fs.readFileSync(process.env.SSL_CERT_PATH) : null,
		ca: process.env.SSL_CA_PATH ? fs.readFileSync(process.env.SSL_CA_PATH) : null
	},
	// file watcher config for chokidar
	watch: {
		cwd: path.resolve(process.cwd(), process.env.CWD),
		files: ['**/*.js', '**/*.css', '**/*.html', '*/apps/*/view/**/*.base', '*/apps/*/view/**/*.tpl', '**/*.lng'],
		ignored: [
			// common folder
			'**/node_modules/**',
			'**/.git/**',
			'**/dist/**',
			'**/build/**',
			// common framework project 
			'uikit/**',
			'static/**',
			'system/**',
			'server/**',
			'account/**',
			'api/**',
			'databases/**',
			// in app backend logic folder
			'*/dev/**',
			'*/tests/**',
			'*/test/**',
			'*/www/**',
			'*/conf/**',
			'*/apps/api/**',
			'*/apps/*/action/**',
			'*/apt/layout/**',
			'*/apt/helper/**',
			'*/apt/template/**',
			'*/apt/theme/**',
			'*/apt/static/image/**',
			// not relate front-end files
			'**/*.php',
			'**/*.md',
			'**/*.ini',
			'**/*.json',
			'**/*.db',
			'**/*.sql',
			'**/*.sh',
			'**/*.bak',
			'**/.*',
		],
		persistent: true,
		ignoreInitial: true,
	},
	// plugins
	plugins: [
		QueuePlugin()
	],
	// clients config
	clients: ClientConfig,
};

export default config;
