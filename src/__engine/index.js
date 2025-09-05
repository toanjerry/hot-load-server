import path from 'path'
import Back from './back.js'

const Engine = { back: Back, front: path.resolve(import.meta.dirname, 'front.js') }

export default Engine

export const Config = {
	id: 'default',
	overlay: true,
	engine: Engine,
	inject: {
		minimize: false
	},
	matchFile: (path, hot) => path.split('/')[0] === hot.rootFolder,
	match: (conn, hot) => conn.origin === hot.url
}
