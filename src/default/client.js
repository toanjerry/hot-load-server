import { FrontEngine } from './front.js'
import { BackEngine } from './back.js'

export default {
	id: 'default',
	overlay: true,
	entryPoints: './public/index.html',
	engine: {back: BackEngine, front: FrontEngine},
	inject: {
		minimize: false
	},
	matchFile: (path, hot) => path.split('/')[0] === hot.rootFolder,
	match: (info, hot) => info.app === 'hot'
}