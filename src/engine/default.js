import {arrayGroup} from '../helper/array.js';

const DefaultEngine = {
	name: "default",
	process: (changes, hot) => {
		const clientChanges = []
		const actionGroup = arrayGroup(changes, (c) => {
			const path = c.path
			if (path.includes('public')) {
				if (path.endsWith('.js')) {
					return 'refresh-js'
				} else if (path.endsWith('css')) {
					return 'refresh-css'
				} else {
					return 'refresh'
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

