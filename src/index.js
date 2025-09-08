import DefaultConfig from './default/config.js'
import HotServer from './hot.js'

export function createServer (config = null, events = null) {
	const hot = new HotServer(config || DefaultConfig)

	hot.init()

	process.on('SIGINT', () => {
		hot.injecter.remove()
		if (events && events.onExit) events.onExit(hot)
		process.exit()
	})
	process.on('SIGTERM', () => {
		hot.injecter.remove()
		if (events && events.onExit) events.onExit(hot)
		process.exit()
	})

	return hot
}