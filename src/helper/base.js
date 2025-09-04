import { spawnCmd } from "./index.js"
import { arrayBulk, combineObjs} from "./array.js"

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
		spawnCmd('php', ['./script/cache.lang.php', app, lang])
			.then(stdout => console.log(`Cache: lang ${app}`))
			.catch(err => console.error({err}))
	})
}
