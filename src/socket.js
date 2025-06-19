import { WebSocketServer } from 'ws';
import { isOriginAllowed } from './helper.js';

class SocketServer {
	constructor(server, config) {
		this.config = config;
		this.clients = new Map();

		this.wss = new WebSocketServer({
			server,
			clientTracking: true,
			verifyClient: this.verifyClient.bind(this)
		});

		this.setupWebSocketServer();
	}

	verifyClient({ origin = '' }) {
		if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
			return true;
		}

		return isOriginAllowed(origin, this.config.domains || [`${config.protocol}://${config.host}:${config.port}`]);
	}

	handleClientRegistration(ws, data) {
		const info = {
			id: data.id || '',
			url: data.url || ''
		};

		this.clients.set(ws, info);
		console.info(`Connected: ${data.id} - ${data.url}`);
		
		ws.send(JSON.stringify({ type: 'config', opts: this.config.client || {} }));
	}

	handleClientDisconnection(ws) {
		// const info = this.clients.get(ws);

		// // if (info) {
		// // 	console.log(`Disconnected: ${info.app} - ${info.url}`);
		// // } else {
		// // 	console.log(`Disconnected`);
		// // }

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


	broadcast(payload, ids = []) {
		payload = JSON.stringify(payload);

		ids.push('hot')

		for (const [client, info] of this.clients) {
			if (!ids.includes(info.id)) {
				continue;
			}

			if (client.readyState === WebSocket.OPEN) {
				client.send(payload);
			}
		}
	}
}

export default SocketServer;
