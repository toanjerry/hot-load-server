HotEngine.create(new function () {
	this.name = 'base'
	this.opts = {
		reconnectInterval: 3000,
	}
	this.init = function () {
		this.state = new StageManager()
		this.state.init()
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
			this.state.reload()
		}
	}
	function updateJS (change) {
		try {
			eval(change.code.js || '')
		} catch (err) {
			console.error('HOT: ', err)
			HMR.overlay(err, {event: change.event, path: change.path, time: change.time}, false)
		}
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

function StageManager (runer) {
	const run = window.eval
	this.renderStack = []
	this.init = function () {
		const state = this

		const originalEval = window.eval
		window.eval = function (js) {
			state.updateRenders(parseRender(js))
			return originalEval(js)
		}

		const originDocReady = $.fn.ready
		$.fn.ready = function (fn) {
			state.updateRenders(parseRender(`(${fn.toString()})()`))
			return originDocReady(fn)
		}

		const originRewrite = AP.rewriteRedirect
		AP.rewriteRedirect = function (url) {
			if (AP.rewriteCheck(url)) {
				state.updateRenders(parseRender(() => originRewrite(url), url, 'rewriteRedirect'))
			}
			return originRewrite(url)
		}

		const originGetDialog = AP.dialog
		AP.dialog = function (id, engine) {
			let dialog = originGetDialog(id, engine)
			const originShow = dialog.show
			dialog.show = function () {
				const ct = getCallStack()
				if (ct.includes('AP.rewriteRedirect')) {
					state.updateParentRender({dialog: this._id})
				} else {
					state.updateRenders(parseRender(() => originGetDialog(this._id).show(), this._id))
				}
				return originShow.call(this)
			}

			const originHide = dialog.hide
			dialog.hide = function () {
				state.removeRendersFrom(this._id)
				return originHide.call(this)
			}

			return dialog
		}
		Object.keys(originGetDialog).forEach(function(prop) {
			AP.dialog[prop] = originGetDialog[prop];
		});

		const originRedirect = AP.redirect
		AP.redirect = function (link) {
			state.updateParentRender()
			return originRedirect.call(this, link)
		}
	}
	this.updateRenders = function (r) {
		if (!r || !r.id) return
		if (r.id === 'init') {
			this.renderStack.length = 0
		}

		ARR.updateByID(this.renderStack, r)

		this.renderStack = ARR.usort(this.renderStack, (e, p) => e.time - p.time)
	}
	this.updateParentRender = function (info) {
		const parentRender = this.renderStack[this.renderStack.length - 1] || null
		if (!parentRender || parentRender.type !== 'rewriteRedirect') return

		if (!info) {
			return this.renderStack.splice(this.renderStack.length - 1)
		}

		for (const key in info) {
			parentRender[key] = info[key]
		}
	}
	this.removeRendersFrom = function (id) {
		const idx = ARR.indexOf(this.renderStack, id, (e) => e.id === id || e.dialog === id)
		if (idx > -1) {
			this.renderStack.splice(idx)
		}
	}
	this.reload = function () {
		try {
			this.renderStack.forEach(e => {
				if (typeof e.js === 'string') {
					run(e.js || '')
				} else {
					e.js()
				}
			})
		} catch (err) {
			console.error(`HOT: reload start false ${err}`)
		}
	}
	function parseRender (js, id = null, type = null) {
		const r = {id, js, type, time: Date.now()}

		if (typeof js === 'string') {
			if (js.includes('(function(){Query.init({')) {
				r.id = 'init',
				r.js = js.replaceAll(/Query\.init[\s\S]*\)\}\)\(\);?/g, '')
			} else if (js.includes('AP.putBaseBlock(')) {
				r.id = 'inline',
				r.js = js.replaceAll(/\(function\(\){AP\.putBaseBlock[\s\S]*\)\}\)\(\);?/g, '')
			}
		}

		return r
	}

	function getCallStack () {
		const lines = new Error().stack.split('\n');

		return lines
			.slice(3)
			.map(line => {
				const match = line.match(/at (\S+)/); // extract function name
				return match ? match[1] : '(anonymous)';
			})
	}
}
