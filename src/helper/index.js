import { spawn, exec } from 'child_process';

export function isOriginAllowed (origin, domains = []) {
	if (!origin) {
		return true;
	}

	return domains.some(domain => {
		if (domain.startsWith('*.')) {
			const regexPattern = domain
				.replace(/\./g, '\\.')
				.replace('*\\.', '([a-zA-Z0-9-]+\\.)?');

			return new RegExp(`^https?:\\/\\/${regexPattern}(:\\d+)?$`).test(origin);
		}

		return origin === `http://${domain}` || origin === `https://${domain}`;
	});
}

export function execCmd (cmd, args) {
	return new Promise((resolve, reject) => {
		exec(`${cmd} ${args.join(' ')}`, (err, stdout, stderr) => {
			if (stderr) console.error(`Stderr: ${stderr}`)
			if (err) reject(err)
			else resolve(stdout)
		});
	});
}

export function spawnCmd(cmd, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { encoding: 'utf-8' });
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', data => { stdout += data; });
		child.stderr.on('data', data => { stderr += data; });
		child.on('close', code => {
			if (code === 0) resolve(stdout)
			else reject(`${stdout}\n${stderr}`)
			if (stderr) console.log(`Stderr: ${stderr}`)
		});
	});
}
