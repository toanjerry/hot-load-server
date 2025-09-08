import path from 'path'
import { fileURLToPath } from 'url'

import Back from './engine/back.js'

export const Engine = { back: Back, front: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'engine', 'front.js') }

export default {
	id: 'default',
	overlay: true,
	engine: Engine,
	inject: {
		minimize: false
	},
	matchFile: (path, hot) => hot.root === hot.watch.cwd || path.split('/')[0] === hot.rootFolder,
	match: (conn, hot) => conn.origin === hot.url
}
