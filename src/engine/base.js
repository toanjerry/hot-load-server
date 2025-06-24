import fs from 'fs';
import {compiler} from '../helper/base.js';

const BaseEngine = {
	name: "Base",
	process: async (changes, hot) => {
		const cwd = hot.watch.cwd
		
		const src_map = await compiler(changes.map((c) => c.path)) || {}

		console.log(src_map)

		const apps = new Set()
		changes.forEach(change => {
			const path = change.path
			const src = src_map[path] || ''
			if (path.endsWith('js')) {
				change.action = 'update-js'
				if (src) {
					change.js = fs.readFileSync(`${cwd}/${src}`, 'utf-8')
				}
			} else if (path.endsWith('css')) {
				change.action = 'update-css'
				if (src) {
					payload.css = require('fs').readFileSync(`${cwd}/${src}`, 'utf-8')
				}
			} else if (path.endsWith('base') || path.endsWith('base')) {
				change.action = 'update-tpl'
				change.js = fs.readFileSync(`${cwd}/${src}`, 'utf-8')
			} else if (path.endsWith('static.php')) {
				change.action = 'refresh'
			}

			apps.add(path.split(/[\\/]/)[0]);
		});

		if (apps.has('hrm')) {
			apps.add('me')
		}

		return Array.from(apps)
	}
}

export default BaseEngine
