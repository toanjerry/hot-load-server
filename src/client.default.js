
import Engine from '../engines/__/engine.js'

export default {
	id: 'default',
	overlay: true,
	engine: Engine,
	inject: {
		minimize: false
	},
	matchFile: (path, hot) => path.split('/')[0] === hot.rootFolder,
	match: (conn, hot) => conn.origin === hot.url
}