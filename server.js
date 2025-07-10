import config from './hot.config.js';
import HotServer from './src/hot.js';

const hot = new HotServer(config)

hot.injecter.inject()

process.on('SIGINT', () => {
	hot.injecter.remove()
	process.exit();
});
process.on('SIGTERM', () => {
	hot.injecter.remove()
	process.exit();
});
