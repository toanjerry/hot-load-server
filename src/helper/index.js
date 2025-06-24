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

export async function runCmd (cmd) {
	const { exec } = await import('child_process');

	try {
		return await new Promise((resolve) => {
			exec(cmd, (err, stdout, stderr) => {
				if (err) {
					resolve({ err: `${err.message}\n${stdout}` });
					return;
				}
				if (stderr) {
					console.error(`Stderr: ${stderr}`);
				}

				resolve({ msg: stdout });
			});
		});
	} catch (e) {
		return { err: e }
	}
}
