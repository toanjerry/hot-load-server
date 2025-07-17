import { runCmd } from "./index.js"
import { arrayBulk, combineObjs} from "./array.js"

export async function compile(app, files) {
	if (!app) return
	if (!files || !files.length) return
	
	// Devide into each chunk 50 file => prevent from error command too long
	const promises = arrayBulk(files, 50).map(async chunk => {
		const rs = await runCmd(`php ./script/compile.base.php ${app} ${chunk.join(',')}`);
		if (rs.err) {
			console.error(rs)
			return
		}
		try {
			return JSON.parse(rs.msg);
		} catch (err) {
			console.error(rs)
			return {}
		}
	});

	let rs = await Promise.all(promises)
	
	return combineObjs(rs)
}

export async function cacheLang(apps, lang = 'vi') {
	if (!apps || !apps.length) return

	apps.forEach(async app => {
		let rs = await runCmd(`php ./script/cache.lang.php ${app} ${lang}`);
		if (rs.err) {
			console.error(rs)
			return
		}
	
		console.log(`Cache: lang ${app}`)
	});
}
