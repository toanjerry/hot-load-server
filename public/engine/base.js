HotEngine.create(new function () {
	this.name = 'base'
	this.opts = {
		reconnectInterval: 3000,
	}
	this.init = function () {
		HMR.state = new StageManager()
		HMR.state.init()
	}
	this.process = function (changes) {
		if (changes[HotEngine.REFRESH_X]) {
			AP.xRefresh()
		}

		if (changes[HotEngine.UPDATE_CSS]) {
			changes[HotEngine.UPDATE_CSS].forEach(change => updateCSS(change))
		}
		if (changes[HotEngine.UPDATE_JS]) {
			changes[HotEngine.UPDATE_JS].forEach(change => {
				if (!change.code.js) return
				change.code.js = HMR.state.render.keepCodeState(change.code.js)
				updateJS(change)
			})
			HMR.state.render.reload()
		}
	}
	function updateJS (change) {
		try {
			eval(change.code.js || '')
		} catch (err) {
			console.error('HOT: Update JS ', err)
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

function StageManager () {
	this.render = new StageRender()
	this.watcher = new ObjectWatcher()
	this.middlewares = [
		// tracking rerun code => prevent from unexpectation changing data
		{
			id: 'array',
			ctx: Array.prototype,
			fn: 'push',
			run: (ctx) => {
				const arrCheck = [
					AP && AP.rules || null,
					SuperTable && SuperTable.mdefs || ''
				]
				if (!arrCheck.includes(ctx.t)) return

				ctx.next = false
				ctx.rs = 0
				ctx.args.forEach(a => {
					const idx = ARR.indexOf(ctx.t, a, (e, a) => {
						if (ctx.t === AP.rules) return e.pattern === a.pattern
						if (ctx.t === SuperTable.mdefs) return e.id === a.id

						return false
					})

					if (idx !== -1) return ctx.t[idx] = a

					ctx.rs += ctx.mid.origin.call(ctx.t, a)
				})
			}
		},
		// tracking actions for rerendering => keep state on screen
		{
			id: 'window.eval',
			ctx: window,
			fn: 'eval',
			run: (ctx, js) => this.render.update(js)
		},
		{
			id: 'document.ready',
			ctx: $.fn,
			fn: 'ready',
			run: (ctx, fn) => this.render.update(`(${fn.toString()})()`)
		},
		{
			id: 'form.submit',
			ctx: $.fn,
			fn: 'submit',
			run: (ctx) => this.render.updateParent()
		},
		{
			id: 'rewriteRedirect',
			ctx: AP,
			fn: 'rewriteRedirect',
			run: (ctx, url) => AP.rewriteCheck(url) && this.render.update(ctx.mid.origin.bind(ctx.mid.ctx, url), url, ctx.mid.id)
		},
		{
			id: 'redirect',
			ctx: AP,
			fn: 'redirect',
			run: (ctx) => this.render.updateParent()
		},
		{
			id: 'dialog',
			ctx: AP,
			fn: 'dialog',
			passRs: true,
			run: (ctx) => {
				const state = this
				const originShow = ctx.rs.show
				ctx.rs.show = function () {
					const ct = getCallStack()
					if (ct.includes('AP.rewriteRedirect')) {
						state.render.updateParent({dialog: this._id})
					} else {
						state.render.update(() => ctx.mid.origin.call(ctx.mid.ctx, this._id).show(), this._id)
					}
					return originShow.call(this)
				}

				const originHide = ctx.rs.hide
				ctx.rs.hide = function () {
					state.render.removeFrom(this._id)
					return originHide.call(this)
				}
			}
		},
		// tracking object changing for rebinding object referrence
		{
			id: 'Rewrite.obj',
			ctx: Rewrite,
			fn: 'obj',
			run: (ctx, module, handlers) => {
				this.watcher.add(module, {
					change: () => ctx.mid.origin.call(ctx.mid.ctx, module, handlers),
				})
			}
		},
	]
	
	this.init = function () {
		const state = this

		this.middlewares.forEach(m => {
			if (m.origin) return
			m.origin = m.ctx[m.fn]

			m.ctx[m.fn] = function (...args) {
				const runCtx = {mid: m, t: this, args, rs: null}
				if (m.passRs) {
					runCtx.rs = m.origin.call(this, ...args)
					m.run.call(state, runCtx, ...args)
				} else {
					m.run.call(state, runCtx, ...args)
					if (runCtx.next !== false) {
						runCtx.rs = m.origin.call(this, ...args)
					}
				}

				return runCtx.rs
			}

			this.assignObjectRecursive(m.ctx[m.fn], m.origin)
		})
	}
	this.assignObjectRecursive = function (o1, o2) {
		for (const key in o2) {
			if (!Object.prototype.hasOwnProperty.call(o2, key)) continue

			if (typeof o1[key] !== typeof o2[key]) {
				o1[key] = o2[key]
			} else if (typeof o1[key] === 'function') {
				if (o1[key].toString().trim().replaceAll(/(\s*\n\s*){2,}/g, '\n') !== o2[key].toString().trim().replaceAll(/(\s*\n\s*){2,}/g, '\n')) {
					o1[key] = o2[key]
				}
			} else if (typeof o1[key] === 'object') {
				let isPureObject = !Array.isArray(o1[key]) &&
					!(o1[key] instanceof Date) &&
					!(o1[key] instanceof RegExp) &&
					!(o1[key] instanceof Map) &&
					!(o1[key] instanceof Set) &&
					!(o1[key] instanceof WeakMap) &&
					!(o1[key] instanceof WeakSet)

				if (isPureObject) this.assignObjectRecursive(o1[key], o2[key])
			} else {
				o1[key] = o2[key]
			}
		}
	}
	function getCallStack (from = 2) {
		const lines = new Error().stack.split('\n');

		return lines
			.slice(1+from)
			.map(line => {
				const match = line.match(/at (\S+)/); // extract function name
				return match ? match[1] : '(anonymous)';
			})
	}
}

function StageRender () {
	this._rds = []
	const run = window.eval
	this.update = function (js, id = null, type = null) {
		const r = this.parseRender(js, id, type)
		if (!r || !r.id) return

		if (r.id === 'init') this._rds.length = 0

		ARR.updateByID(this._rds, r)

		this._rds = ARR.usort(this._rds, (e, p) => e.time - p.time)
	}
	this.updateParent = function (info) {
		const parent = this._rds[this._rds.length - 1] || null
		if (!parent || parent.type !== 'rewriteRedirect') return

		if (!info) {
			return this._rds.splice(this._rds.length - 1)
		}

		for (const key in info) {
			parent[key] = info[key]
		}
	}
	this.removeFrom = function (id) {
		const idx = ARR.indexOf(this._rds, id, (e) => e.id === id || e.dialog === id)
		if (idx > -1) {
			this._rds.splice(idx)
		}
	}
	this.reload = function () {
		try {
			this._rds.forEach(e => e.js && e.js())
		} catch (err) {
			console.error(`HOT: State - reload false ${err}`)
		}
	}
	this.keepCodeState = function (js) {
		// keep object props when running code again
		let objs = new Set()
		for (const match of js.matchAll(/([a-zA-Z_\.]+)\s?=\s?(new\s+?|{|Object\.)+/gm)) {
			if (!match[1].startsWith('this.')) objs.add(match[1])
		}

		if (!objs.size) return js

		objs = [...objs]

		return 'const origin_objs = {\n\t'
			+objs.map(o => `'${o}': ${o}`).join(',\n\t')
			+'\n}\n'
			+js
			+'\nfor (const name in origin_objs) {\n'
			+'	const n_o = getFunctionByName(name)\n'
			+'	if (!n_o) continue\n'
			+'	HMR.state.assignObjectRecursive(origin_objs[name], n_o)\n'
			+'}\n'
			+objs.map(o => `${o}=origin_objs['${o}']`).join('\n')
			+'\n'
			+objs.map(o => `HMR.state.watcher.change(${o})`).join('\n')
	}
	this.parseRender = function (js, id = null, type = null) {
		const r = {id, js, type, time: Date.now()}

		if (typeof js === 'string') {
			if (js.includes('(function(){Query.init({')) {
				r.id = 'init',
				r.js = js.replaceAll(/Query\.init[\s\S]*\)\}\)\(\);?/g, '')
			} else if (js.includes('AP.putBaseBlock(')) {
				r.id = 'inline',
				r.js = js.replaceAll(/\(function\(\){AP\.putBaseBlock[\s\S]*\)\}\)\(\);?/g, '')
			}
			
			if (r.id) {
				try {
					r.js = run(`() => {${this.keepCodeState(r.js)}}`)
				} catch (err) {
					console.error(`HOT: State - parse false ${err}`)
				}
			}
		}

		return r
	}
}

function ObjectWatcher () {
	this.objs = {}
	this.add = (obj, events) => {
		this.objs[obj.constructor.name] = events
	}
	this.dispatch = (event, obj) => {
		const name = obj.constructor.name
		if (this.objs[name] && this.objs[name][event]) {
			this.objs[name][event]()
		}
	}
	this.change = obj => this.dispatch('change', obj)
	this.reset = obj => this.dispatch('reset', obj)
}
