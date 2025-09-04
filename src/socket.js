import { WebSocketServer } from 'ws'
import { isOriginAllowed } from './helper/index.js'

class SocketServer {
	constructor(hot) {
		this.hot = hot
		this.conns = new Map()

		this.wss = new WebSocketServer({
			server: this.hot.server,
			clientTracking: true,
			verifyClient: this.verifyClient.bind(this)
		})

		this.setupWebSocketServer()
	}

	verifyClient({ origin = '' }) {
		if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
			return true
		}

		return isOriginAllowed(origin, this.hot.config.domains || [this.hot.domain])
	}

	handleClientRegistration(ws, info) {
		const client = this.hot.matchClient(info, false)
		if (!client.id) return
		
		info.client_id = client.id
		info.connectedAt = new Date()

		this.conns.set(ws, info)
		
		// send config of client
		ws.send(JSON.stringify({
			type: 'config',
			opts: {
				id: client.id,
				overlay: client.overlay || false,
				inject: client.inject || {},
			}
		}))

		console.info(`Connected: ${info.origin || 'URL NA'}`)
	}

	handleClientDisconnection(ws) {
		this.conns.delete(ws)
	}

	setupWebSocketServer() {
		this.wss.on('connection', (ws, req) => {
			ws.on('message', (message) => {
				try {
					const data = JSON.parse(message)
					if (data.type === 'register') {
						this.handleClientRegistration(ws, data.info || {})
					}
				} catch (err) {
					console.error('Error processing message:', err)
				}
			})

			ws.on('close', () => this.handleClientDisconnection(ws))
			ws.on('error', (error) => {
				console.error('WebSocket error:', error)
				this.conns.delete(ws)
			})
		})
	}
	
	broadcast (client, actions) {
		const payload = JSON.stringify({type: 'change', actions})

		for (const [conn, info] of this.conns) {
			if (info.client_id && info.client_id !== client.id) continue

			if (conn.readyState === WebSocket.OPEN) {
				conn.send(payload)
			}
		}
	}
}

export default SocketServer
