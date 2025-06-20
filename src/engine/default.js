const DefaultEngine = {
	name: "Hot",
	process: function (payload, hot) {
		const path = payload.path

		payload.action = 'log'
		if (path.includes('public')) {
			if (path.endsWith('.js')) {
				payload.action = 'refresh-js'
			} else if (path.endsWith('css')) {
				payload.action = 'refresh-css'
			} else {
				payload.action = 'refresh'
			}
		}

		hot.ws.broadcast(payload)
	}
}

export default DefaultEngine
