import config from './hot.config.js';
import HotServer from './src/hot.js';

const hot = new HotServer(config)
hot.injectClient()
