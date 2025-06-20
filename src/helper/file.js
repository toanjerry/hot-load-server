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

export function injectScript(path, scriptTag) {
	try {
		if (fs.existsSync(path)) {
			let html = getContent(path);
			if (html.includes(scriptTag)) return;

			if (html.includes('</body>')) {
				html = html.replace('</body>', `\t${scriptTag}\n</body>`);
			} else {
				html += `\n\t${scriptTag}`;
			}
			fs.writeFileSync(path, html, 'utf8');
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
