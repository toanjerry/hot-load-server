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
