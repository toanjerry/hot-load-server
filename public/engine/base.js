HotEngine.create(new function () {
	this.name = 'base'
	this.opts = {
		reconnectInterval: 3000,
	}
	this.process = function (changes) {
		if (changes[HotEngine.REFRESH_X]) {
			AP.xRefresh()
		}

		if (changes[HotEngine.UPDATE_CSS]) {
			changes[HotEngine.UPDATE_CSS].forEach(change => updateCSS(change.code, change.url, change.pattern))
		}
		if (changes[HotEngine.UPDATE_JS]) {
			changes[HotEngine.UPDATE_JS].forEach(change => updateJS(change.code))
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
