import {compile, cacheLang} from '../helper/base.js';
import {arrayGroup} from '../helper/array.js';

const BaseEngine = {
	name: "Base",
	init: (hot) => {
		const config = hot.config?.clients?.base || {}
		if (config?.langCache?.length) {
			cacheLang(config.langCache)
		}
	},
	process: async (changes, hot) => {
		changes = arrayGroup(changes, c => c.path.split(/[\\/]/)[0])

		const clientChanges = []
		for (const app in changes) {
			const actionGroup = arrayGroup(changes[app], (c) => {
				const path = c.path
				if (path.endsWith('.js')) {
					c.pattern = '.*\.base\.beta\/js\/'
					return c.event === 'delete' ? 'refresh-js' : 'update-js'
				} else if (path.endsWith('.css')) {
					c.pattern = '.*\.base\.beta\/css\/'
					return 'refresh-css'
				} else if (path.endsWith('.base') || path.endsWith('.tpl')) {
					return 'refresh-x'
				} else if (path.endsWith('.lng')) {
					return 'refresh-lang'
				} else if (path.endsWith('static.php')) {
					return 'refresh'
				}

				return 'log'
			})

			if (actionGroup['refresh']?.length) {
				clientChanges.push({
					actions: {refresh: actionGroup['refresh']},
					filter: info => info.app === app
				})
				delete actionGroup['refresh']
				continue
			}
			if (actionGroup['refresh-lang']?.length) {
				delete actionGroup['refresh-lang']
				cacheLang([app])
			}
			if (actionGroup['refresh-css']?.length) {
				delete actionGroup['update-css']
			}
			if (actionGroup['refresh-js']?.length) {
				delete actionGroup['update-js']
			}

			const compileChanges = [
				...actionGroup['update-js'] || [],
				...actionGroup['update-css'] || [],
				...actionGroup['update-tpl'] || [],
			]
			
			// compile js, css files
			const src_map = await compile(app, compileChanges.map(c => c.path)) || {}
			compileChanges.forEach(c => {
				c.code = src_map[c.path] || {}
			})

			clientChanges.push({
				actions: actionGroup,
				filter: info => info.app === app
			})
		}

		return clientChanges
	}
}

export default BaseEngine
