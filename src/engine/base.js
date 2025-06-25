import {compile, cacheLang} from '../helper/base.js';

const BaseEngine = {
	name: "Base",
	init: (hot) => {
		const config = hot.config?.clients?.base || {}
		if (config?.data?.langCache?.length) {
			cacheLang(config.data.langCache)
		}
	},
	process: async (changes, hot) => {
		// compile files
		const src_map = await compile(changes.map((c) => c.event !== 'delete' && c.path)) || {}

		const apps = new Set()
		changes.forEach(change => {
			const path = change.path
			const src = src_map[path] || {}
			const app = path.split(/[\\/]/)[0]
			apps.add(app);

			if (path.endsWith('.js')) {
				change.pattern = '.*\.base\.beta\/js\/'

				if (change.event === 'delete') {
					change.action = 'refresh-js'
				} else if (change.type === 'change') {
					if (!src.js) { // remove all code of file
						change.action = 'refresh-js'
					} else {
						change.action = 'update-js'
						change.js = src.js
					}
				} else {
					change.action = 'update-js'
					change.js = src.js || ''
				}
			} else if (path.endsWith('.css')) {
				change.pattern = '.*\.base\.beta\/css\/'
				if (change.event === 'delete') {
					change.action = 'refresh-css'
				} else if (change.type === 'change') {
					if (!src.css) { // remove all code of file
						change.action = 'refresh-css'
					} else {
						change.action = 'update-css'
						change.css = src.css
					}
				} else {
					change.action = 'update-css'
					change.css = src.css || ''
				}
			} else if (path.endsWith('.base') || path.endsWith('.tpl')) {
				if (change.event === 'delete') {
					change.action = 'xrefresh'
				} else {
					change.action = 'update-tpl'
					change.js = src.js || ''
					change.title = src.title || ''
					change.html = src.html || ''
					change.reset = src.reset || ''
					change.update = src.update || ''
				}
			} else if (path.endsWith('.lng')) {
				cacheLang([app])
			} else if (path.endsWith('static.php')) {
				change.action = 'refresh'
			}
		});

		if (apps.has('hrm')) {
			apps.add('me')
		}

		// broadcast to apps
		return Array.from(apps)
	}
}

export default BaseEngine
