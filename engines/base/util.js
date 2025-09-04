import { spawn, exec } from 'child_process'

export function arrayGroup(arr, keyBuilder) {
	const groups = {}
	for (const item of arr) {
		const key = keyBuilder(item)
		if (!groups[key]) {
			groups[key] = []
		}
		groups[key].push(item)
	}
	
	return groups
}

export function arrayBulk (arr, size) {
	const bulk = []
	for (let i = 0; i < arr.length; i += size) {
		bulk.push(arr.slice(i, i + size))
	}

	return bulk
}

export function combineObjs (arr) {
	const rs = {}
	for (const obj of arr) {
		if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
			Object.assign(rs, obj)
		}
	}

	return rs
}

export function execCmd (cmd, args) {
	return new Promise((resolve, reject) => {
		exec(`${cmd} ${args.join(' ')}`, (err, stdout) => {
			if (err) reject(err)
			else resolve(stdout)
		})
	})
}

export function spawnCmd (cmd, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { encoding: 'utf-8' })
		let stdout = ''
		let stderr = ''
		child.stdout.on('data', data => { stdout += data })
		child.stderr.on('data', data => { stderr += data })
		child.on('close', code => {
			if (code === 0) resolve(stdout)
			else reject(`${stdout}\n${stderr}`)
		})
	})
}

export async function compile(app, files) {
	if (!app) return
	if (!files || !files.length) return
	
	// Devide into each chunk 50 file => prevent from error command too long
	const promises = arrayBulk(files, 50).map(chunk => spawnCmd('php', ['./script/compile.base.php', app, chunk.join(',')]))
	const rs = await Promise.allSettled(promises)

	for (const idx in rs) {
		const p = rs[idx]
		if (p.status === 'rejected') {
			console.error({err: p.reason})
			continue
		}
		try {
			p.value = JSON.parse(p.value.match(/{.*}/s)[0] || '{}')
		} catch (err) {
			p.value = {}
			console.error({err})
		}

		rs[idx] = p.value
	}
	
	return combineObjs(rs)
}

export function cacheLang(apps, lang = 'vi') {
	if (!apps) return

	apps.forEach(app => {
		spawnCmd('php', ['./engines/base/scripts/cache.lang.php', app, lang])
			.then(stdout => console.log(`Cache: lang ${app}`))
			.catch(err => console.error({err}))
	})
}
