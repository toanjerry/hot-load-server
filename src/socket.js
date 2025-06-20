import { WebSocketServer } from 'ws';
import { isOriginAllowed } from './helper/index.js';

import {clientByHost} from '../client.config.js'

class SocketServer {
	constructor(hot) {
		this.hot = hot
		this.clients = new Map();

		this.wss = new WebSocketServer({
			server: this.hot.server,
			clientTracking: true,
			verifyClient: this.verifyClient.bind(this)
		});

		this.setupWebSocketServer();
	}

	verifyClient({ origin = '' }) {
		if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
			return true;
		}

		return isOriginAllowed(origin, this.hot.config.domains || [this.hot.domain]);
	}

	handleClientRegistration(ws, data) {
		const info = {
			app: data.app || '',
			origin: data.origin,
			domain: data.domain || '',
			connectedAt: new Date()
		};

		this.clients.set(ws, info);
		
		console.info(`Connected: ${data.app} - ${data.origin}`);
		
		// send config of client
		const clientId = clientByHost(info.domain) || 'default'
		ws.send(JSON.stringify({
			type: 'config',
			opts: this.hot.config?.clients[clientId] || {}
		}));
	}

	handleClientDisconnection(ws) {
		this.clients.delete(ws);
	}

	setupWebSocketServer() {
		this.wss.on('connection', (ws, req) => {
			ws.on('message', (message) => {
				try {
					const data = JSON.parse(message);
					if (data.type === 'register') {
						this.handleClientRegistration(ws, data);
					}
				} catch (err) {
					console.error('Error processing message:', err);
				}
			});

			ws.on('close', () => this.handleClientDisconnection(ws));
			ws.on('error', (error) => {
				console.error('WebSocket error:', error);
				this.clients.delete(ws);
			});
		});
	}


	broadcast(payload, apps = []) {
		payload = JSON.stringify(payload);

		apps.push('hot')

		for (const [client, info] of this.clients) {
			if (!apps.includes(info.app)) {
				continue;
			}

			if (client.readyState === WebSocket.OPEN) {
				client.send(payload);
			}
		}
	}
}

export default SocketServer;
