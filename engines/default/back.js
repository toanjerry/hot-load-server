import { arrayGroup } from '../../src/helper/array.js';

const DefaultEngine = {
	name: "default",
	process: (changes, hot) => {
		const clientChanges = []
		const actionGroup = arrayGroup(changes, (c) => {
			const path = c.path
			if (path.includes('public')) {
				if (path.endsWith('.js')) {
					return 'reload-js'
				} else if (path.endsWith('css')) {
					return 'reload-css'
				} else {
					return 'reload'
				}
			}

			return 'log'
		})

		clientChanges.push({
			actions: actionGroup,
			filter: info => info.app === 'hot'
		})

		return clientChanges
	}
}

export default DefaultEngine

