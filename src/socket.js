import { WebSocketServer } from 'ws';
import { isOriginAllowed } from './helper/index.js';

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

	handleClientRegistration(ws, info) {
		info.connectedAt = new Date()

		this.clients.set(ws, info);
		
		console.info(`Connected: ${info.app || 'App NA'} - ${info.origin || 'URL NA'}`);
		
		// send config of client
		ws.send(JSON.stringify({
			type: 'config',
			opts: this.hot.getClientConfig(info, false)
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
						this.handleClientRegistration(ws, data.info || {});
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
	
	broadcast(changes) {
		changes.forEach(c => {
			const payload = JSON.stringify({type: 'change', actions: c.actions});

			for (const [client, info] of this.clients) {
				if (c.filter && !c.filter(info)) {
					continue;
				}

				if (client.readyState === WebSocket.OPEN) {
					client.send(payload);
				}
			}
		});

	}
}

export default SocketServer;
