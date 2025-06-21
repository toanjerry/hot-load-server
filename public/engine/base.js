HotEngine.create(new function () {
	this.name = 'base'
	this.opts = {
		reconnectInterval: 3000,
	}
	this.process = change => {
		if (change.action === 'update-js') {
			updateJS(change.js, change.file_id)
		} else if (change.action === 'update-css') {
			updateCSS(change.css, change.file_id)
		} else if (change.action === 'update-tpl') {
			updateJS(change.js, change.file_id)
		} else if (change.action === 'xRefresh') {
			AP.xRefresh()
		} else if (change.action === 'refresh') {
			AP.refresh()
		}
	},

	function updateJS (js, file_id) {
		if (!js) return
		eval(js);
	}
	function updateCSS (css, file_id) {
		if (!file_id) return;

		const sheet = document.styleSheets.find(style => style.href === file_id);
		if (!sheet) return;

		for (let rule of sheet.cssRules) {
			if (rule.media && rule.cssRules) {
				for (let subRule of rule.cssRules) {
					if (subRule.selectorText === ".responsive") {
						subRule.style.display = "flex";
					}
				}
			}
		}

		// Add or modify a CSS rule
		stylesheet.insertRule(css, stylesheet.cssRules.length);
	}
})
