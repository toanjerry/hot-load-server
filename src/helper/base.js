import { runCmd } from "./index.js"

export async function compile(files) {
	if (!files || !files.length) return
	
	let rs = await runCmd(`php ./script/compile.base.php ${files.join(',')}`);
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
}

export async function cacheLang(apps, lang = 'vi') {
	if (!apps || !apps.length) return
	
	let rs = await runCmd(`php ./script/cache.lang.php ${apps.join(',')} ${lang}`);
	if (rs.err) {
		console.error(rs)
		return
	}

	console.log(`Lang cached ${apps.join(', ')}`)
}
