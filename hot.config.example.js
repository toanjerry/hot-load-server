import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import ClientConfig from './client.config.js'

// Load environment variables
dotenv.config();

const config = {
	host: process.env.HOST || 'localhost',
	port: process.env.PORT || '3000',
	protocol: process.env.PROTOCOL || 'https',
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
		files: ['**/*.js', '**/*.css', '**/*.html', '**/*.base', '**/*.tpl'],
		ignored: [
			'**/node_modules/**',
			'**/.git/**',
			'**/dist/**',
			'**/build/**',
			'uikit/**',
			'system/**',
			'static/**',
			'server/**',
			'account/**',
			'api/**',
			'databases/**',
			// '**/*.css',
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
	// clients config
	clients: ClientConfig,
};

export default config;
