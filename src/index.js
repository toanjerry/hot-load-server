import DefaultConfig from './default/config.js'
import HotServer from './hot.js'

export function createServer (config = null, onExit = null) {
	if (!config) config = DefaultConfig

	const hot = new HotServer(config)

	hot.init()

	process.on('SIGINT', () => {
		hot.injecter.remove()
		if (onExit) onExit(hot)
		process.exit()
	})
	process.on('SIGTERM', () => {
		hot.injecter.remove()
		if (onExit) onExit(hot)
		process.exit()
	})

	return hot
}