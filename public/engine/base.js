HotEngine.create(new function () {
	this.name = 'base'
	this.opts = {
		reconnectInterval: 3000,
	}
	this.process = function (changes) {
		for (const action in changes) {
			if (action === HotEngine.UPDATE_JS) {
				changes[action].forEach(change => updateJS(change.code))
			} else if (action === HotEngine.UPDATE_CSS) {
				changes[action].forEach(change => updateCSS(change.code, change.url, change.pattern))
			} else if (action === 'update-tpl') {
				// updateJS(change.js, change.file_id)
			} else if (action === HotEngine.REFRESH_X) {
				AP.xRefresh()
			}
		}

	}
	function updateJS (code) {
		if (!code.js) return
		eval(code.js);
		// TODO: restore stage
	}
	function updateCSS (code, url, pattern) {
		const targets = HotEngine.getCSSTargets(url, pattern)
		if (!targets || !targets.length) return
		targets.forEach(target => {
			// for (let rule of sheet.cssRules) {
			// 	if (rule.media && rule.cssRules) {
			// 		for (let subRule of rule.cssRules) {
			// 			if (subRule.selectorText === ".responsive") {
			// 				subRule.style.display = "flex";
			// 			}
			// 		}
			// 	}
			// }
			// stylesheet.insertRule(css, stylesheet.cssRules.length);
		})
	}
})
