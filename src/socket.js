import { WebSocketServer, WebSocket } from 'ws'
import { isOriginAllowed } from './util/index.js'

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
		if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true

		return isOriginAllowed(origin, this.hot.clientDomains)
	}

	handleClientRegistration(ws, info) {
		const client = this.hot.matchClient(info, false)
		if (!client.id) return
		
		info.clientId = client.id
		info.connectedAt = new Date()

		this.conns.set(ws, info)
		
		// send config of client
		ws.send(JSON.stringify({
			type: 'config',
			opts: {
				overlay: client.overlay || false,
				inject: client.inject || {},
			}
		}))

		console.info(`Connected: ${info.origin || 'URL NA'}`)
	}

	setupWebSocketServer() {
		this.wss.on('connection', (ws, req) => {
			ws.on('message', (msg) => {
				try {
					const data = JSON.parse(msg)
					if (data.type === 'register') {
						this.handleClientRegistration(ws, data.info || {})
					}
				} catch (err) {
					console.error('Error processing message:', err)
				}
			})

			ws.on('close', () => this.conns.delete(ws))
			ws.on('error', (err) => {
				console.error('WebSocket error:', err)
				this.conns.delete(ws)
			})
		})
	}
	
	broadcast (actions, filter = null) {
		const payload = JSON.stringify({type: 'change', actions})

		for (const [conn, info] of this.conns) {
			if (filter && !filter(info)) continue

			if (conn.readyState === WebSocket.OPEN) {
				conn.send(payload)
			}
		}
	}
}

export default SocketServer
