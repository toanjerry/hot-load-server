export function arrayBulk (arr, size) {
	const bulk = []
	for (let i = 0; i < arr.length; i += size) {
		bulk.push(arr.slice(i, i + size))
	}

	return bulk
}

export function arrayUnique(arr, checker) {
	const seen = new Set()
	const rs = []
	for (const e of arr) {
		const key = checker ? checker(e) : e
		if (!seen.has(key)) {
			seen.add(key)
			rs.push(e)
		}
	}
	
	return rs
}

export function arrayGroup(arr, keyBuilder) {
	const groups = {}
	for (const item of arr) {
		const key = keyBuilder(item)
		if (!groups[key]) {
			groups[key] = []
		}
		groups[key].push(item)
	}
	
	return groups
}

export function arrayFlat (arr) {
	const rs = []
	for (const e of arr) {
		if (Array.isArray(e)) {
			rs.push(...arrayFlat(e))
		} else {
			rs.push(e)
		}
	}

	return rs
}

export function combineObjs (arr) {
	const rs = {}
	for (const obj of arr) {
		if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
			Object.assign(rs, obj)
		}
	}

	return rs
}