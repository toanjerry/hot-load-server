
import { arrayGroup } from '../../src/helper/array.js'

export default {
	name: "default",
	process: (changes) => {
		return arrayGroup(changes, (c) => {
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
	}
}
