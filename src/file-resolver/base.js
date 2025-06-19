import fs from 'fs';

const BaseResolver = {
	name: "Base",
	process: function (payload, hot) {
		const cwd = hot.watch.cwd
		const path = payload.path

		try {
			if (path.endsWith('js')) {
				payload.action = 'update-js'
				payload.js = fs.readFileSync(`${cwd}/${path}`, 'utf-8')
			} else if (path.endsWith('css')) {
				payload.action = 'update-css'
				// payload.js = require('fs').readFileSync(path, 'utf-8')
			} else if (path.endsWith('base') || path.endsWith('base')) {
				payload.action = 'update-tpl'
			} else if (path.endsWith('static.php')) {
				payload.action = 'refresh'
			}
		} catch (err) {
			console.error(err)
		}

		const app = path.split(/[\\/]/)[0];
		let apps = [app]
		if (app === 'hrm' || app === 'me') {
			apps = ['hrm', 'me']
		}

		hot.ws.broadcast(payload, apps)
	}
}

export default BaseResolver
