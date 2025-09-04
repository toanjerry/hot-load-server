import { arrayGroup, compile, cacheLang} from './util.js'

export default {
	name: 'Base',
	init: (hot) => cacheLang(hot.getClient('base')?.apps),
	process: async (changes) => {
		changes = arrayGroup(changes, c => c.path.split('/')[0])

		const appChanges = []
		for (const app in changes) {
			const actionGroup = arrayGroup(changes[app], (c) => {
				const path = c.path
				if (path.endsWith('.js')) {
					c.pattern = '.*\.base\.beta\/js\/'
					return c.event === 'delete' ? 'reload-js' : 'update-js'
				} else if (path.endsWith('.css')) {
					c.pattern = '.*\.base\.beta\/css\/'
					return 'reload-css'
				} else if (path.endsWith('.base') || path.endsWith('.tpl')) {
					return 'ajax'
				} else if (path.endsWith('.lng')) {
					return 'reload-lang'
				} else if (path.endsWith('static.php')) {
					return 'reload'
				}

				return 'log'
			})

			if (actionGroup['reload']?.length) {
				appChanges.push({
					actions: {reload: actionGroup['reload']},
					filter: conn => conn.host === `${app}.base.beta`
				})
				delete actionGroup['reload']
				continue
			}
			if (actionGroup['reload-lang']?.length) {
				delete actionGroup['reload-lang']
				cacheLang([app])
			}
			if (actionGroup['reload-css']?.length) {
				delete actionGroup['reload-css']
			}
			if (actionGroup['reload-js']?.length) {
				delete actionGroup['reload-js']
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

			appChanges.push({
				actions: actionGroup,
				filter: conn => conn.host === `${app}.base.beta`
			})
		}

		return appChanges
	}
}
