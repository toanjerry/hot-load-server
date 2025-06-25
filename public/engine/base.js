HotEngine.create(new function () {
	this.name = 'base'
	this.opts = {
		reconnectInterval: 3000,
	}
	this.process = function (changes) {
		for (const change of changes) {
			if (change.action === HotEngine.UPDATE_JS) {
				updateJS(change.js)
			} else if (change.action === HotEngine.UPDATE_CSS) {
				updateCSS(change.css, change.url, change.pattern)
			} else if (change.action === 'update-tpl') {
				// updateJS(change.js, change.file_id)
			} else if (change.action === HotEngine.REFRESH_X) {
				AP.xRefresh()
			}
		}
	}
	function updateJS (js) {
		if (!js) return
		eval(js);
		// TODO: restore stage
	}
	function updateCSS (css, url, pattern) {
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
