const DefaultEngine = {
	name: "default",
	process: (changes, hot) => {
		changes.forEach(change => {
			const path = change.path
	
			change.action = 'log'
			if (path.includes('public')) {
				if (path.endsWith('.js')) {
					change.action = 'refresh-js'
				} else if (path.endsWith('css')) {
					change.action = 'refresh-css'
				} else {
					change.action = 'refresh'
				}
			}
		});
	}
}

export default DefaultEngine

