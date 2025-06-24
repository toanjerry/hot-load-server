import { runCmd } from "./index.js"

export async function compiler(files) {
	if (!files) return
	
	let rs = await runCmd(`php ./script/base.compiler.php ${files.join(',')}`);
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
