import fs from 'fs';
import { minify } from 'terser';

export function getContent (target) {
	try {
		return fs.readFileSync(target, 'utf-8');
	} catch (err) {
		console.error(`Failed to read ${target}:`, err);
	}
}

export function appendContent (target, src, isPath = true) {
	if (!src) return true
	if (isPath) {
		src = getContent(src)
	}
	if (!src) return true

	try {
		fs.appendFileSync(target, src, 'utf-8');
		return true
	} catch (err) {
		console.error(`Failed to append ${target}:`, err);
		return false
	}
}

export function rewriteContent (target, src, isPath = true) {
	if (!src) return true
	if (isPath) {
		src = getContent(src)
	}
	if (!src) return true

	try {
		fs.writeFileSync(target, src, 'utf-8');
		return true
	} catch (err) {
		console.error(`Failed to rewrite ${target}:`, err);
		return false
	}
}

export function injectScript(path, script,) {
	try {
		if (fs.existsSync(path)) {
			let content = getContent(path);

			const isHTMLFile = content.includes('</body>')

			// reset old inject
			const regex = new RegExp(`[//<hotload>|<!--<hotload>-->][\\s\\S]*?[//</hotload>|<!--</hotload>-->]`, 'g');
			content.replace(regex, '');

			// inject new
			if (isHTMLFile) {
				script = `${startTag}\n${script}\n${endTag}`
				content = content.replace('</body>', `${script}\n</body>`);
			} else {
				script = `//<hotload>\n${script}\n//</hotload>}`
				content += `\n${script}`;
			}

			fs.writeFileSync(path, content, 'utf8');
		}
	} catch (err) {
		console.error(`Failed to inject to ${path}:`, err);
	}
}

export function minimizeContent(target) {
	if (fs.existsSync(target)) {
		const code = fs.readFileSync(target, 'utf8');
		minify(code).then(minified => {
			if (minified.code) {
				fs.writeFileSync(target, minified.code, 'utf8');
			}
		});
	}
}
