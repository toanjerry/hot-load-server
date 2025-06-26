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
			changes[HotEngine.UPDATE_CSS].forEach(change => updateCSS(change))
		}
		if (changes[HotEngine.UPDATE_JS]) {
			changes[HotEngine.UPDATE_JS].forEach(change => updateJS(change))
		}
	}
	function updateJS (change) {
		try {
			if (change?.code?.js) {
				eval(change.code.js)
			}
		} catch (err) {
			console.error('HOT: JS ', err)
			HMR.overlay(err, {event: change.event, path: change.path, time: change.time}, false)
		}
		// TODO: restore stage
	}
	function updateCSS (change) {
		const targets = HotEngine.getCSSTargets(change.url, change.pattern)
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
