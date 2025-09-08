export default {
	name: "default",
	process: (changes) => {
		const actions = {}
		for (const c of changes) {
			const path = c.path
			let key = 'log'
			if (path.includes('public')) {
				if (path.endsWith('.js')) key = 'reload-js'
				else if (path.endsWith('css')) key = 'reload-css'
				else key = 'reload'

				c.url = path.replace('public/', '')
			}
			
			if (!actions[key]) actions[key] = []

			actions[key].push(c)
		}
	
		return [{actions, filter: info => info.clientId === 'default'}]
	}
}
