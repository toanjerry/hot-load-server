import fs from 'fs';
import { minify } from 'terser';

export function getContent (target) {
	try {
		if (!fs.existsSync(target)) {
			return ''
		}

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
	if (isPath) {
		src = getContent(src)
	}

	try {
		fs.writeFileSync(target, src, 'utf-8');
		return true
	} catch (err) {
		console.error(`Failed to rewrite ${target}:`, err);
		return false
	}
}

export function removeScript(target) {
	try {
		if (fs.existsSync(target)) {
			let content = getContent(target);

			let regexJS = /\n*?\/\/<hotload>[\s\S]*?\/\/<\/hotload>/g;
			let regexHTML = /\n*?<!--<hotload>-->[\s\S]*?<!--<\/hotload>-->/g;
			content = content.replace(regexJS, '').replace(regexHTML, '');

			fs.writeFileSync(target, content, 'utf8');
		}
	} catch (err) {
		console.error(`Failed to remove from ${target}:`, err);
	}
}

export function injectScript(target, script, isPath = false) {
	if (isPath) {
		script = getContent(script)
	}
	if (!script) return true

	try {
		if (fs.existsSync(target)) {
			let content = getContent(target);

			// inject new
			if (target.endsWith('.html')) {
				script = `<!--<hotload>-->\n${script}\n<!--<\/hotload>-->`
				if (content.includes('</body>')) {
					content = content.replace('</body>', `${script}\n</body>`);
				} else {
					content += `\n${script}`;
				}
			} else {
				script = `//<hotload>\n${script}\n//</hotload>`
				content += `\n${script}`;
			}

			fs.writeFileSync(target, content, 'utf8');
		}
	} catch (err) {
		console.error(`Failed to inject to ${target}:`, err);
	}
}

export function getStatus (path) {
	return fs.statSync(path)
}

export async function minimizeContent(target) {
	if (fs.existsSync(target)) {
		const code = fs.readFileSync(target, 'utf8');
		await minify(code).then(minified => {
			if (minified.code) {
				fs.writeFileSync(target, minified.code, 'utf8');
			}
		});
	}
}
