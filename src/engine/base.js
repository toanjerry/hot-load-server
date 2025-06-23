import fs from 'fs';

const BaseEngine = {
	name: "Base",
	process: (changes, hot) => {
		const cwd = hot.watch.cwd

		changes.forEach(change => {
			const path = change.path
			try {
				if (path.endsWith('js')) {
					change.action = 'update-js'
					change.js = fs.readFileSync(`${cwd}/${path}`, 'utf-8')
				} else if (path.endsWith('css')) {
					change.action = 'update-css'
					// payload.js = require('fs').readFileSync(path, 'utf-8')
				} else if (path.endsWith('base') || path.endsWith('base')) {
					change.action = 'update-tpl'
				} else if (path.endsWith('static.php')) {
					change.action = 'refresh'
				}
			} catch (err) {
				console.error(err)
			}

			const app = path.split(/[\\/]/)[0];
			const apps = [app]
			if (app === 'hrm') {
				apps.push('me')
			}
		});

		return apps
	}
}

export default BaseEngine
