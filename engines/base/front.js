const Engine = {
	name: 'base',
	opts: {
		reconnectInterval: 3000,
	},
	init: function () {
		HMR.state = new this.StageManager()
		HMR.state.init()
	},
	process: function (changes) {
		if (changes[HotEngine.AJAX]) {
			AP.xRefresh()
		}

		if (changes[HotEngine.UPDATE_CSS]) {
			changes[HotEngine.UPDATE_CSS].forEach(change => updateCSS(change))
		}
		if (changes[HotEngine.UPDATE_JS]) {
			changes[HotEngine.UPDATE_JS].forEach(change => {
				if (!change.code.js) return
				change.code.js = HMR.state.render.keepCodeState(change.code.js)
				this.updateJS(change)
			})
			HMR.state.render.reload()
		}
	},
	updateJS: function (change) {
		try {
			eval(change.code.js || '')
		} catch (err) {
			console.error('HOT: Update JS ', err)
			HMR.overlay(err, {event: change.event, path: change.path, time: change.time}, false)
		}
	},
	updateCSS: function (change) {
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
}

Engine.StageManager = function () {
	this.render = new StageRender()
	this.watch = new ObjectWatcher()
	this.apiCache = new APICache()
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

				for (const k in ctx.args) {
					const idx = ARR.indexOf(ctx.t, ctx.args[k], (e, a) => {
						if (ctx.t === AP.rules) return e.pattern === a.pattern
						if (ctx.t === SuperTable.mdefs) return e.id === a.id

						return false
					})
					if (idx !== -1) {
						ctx.t[idx] = ctx.args[k]
						ctx.args[k] = null
					}
				}

				ctx.args = ctx.args.filter(item => item !== null);
			}
		},
		// tracking actions for rerendering => keep state on screen
		{
			id: 'window.eval',
			ctx: window,
			fn: 'eval',
			run: (ctx) => this.render.update(ctx.args[0])
		},
		{
			id: 'document.ready',
			ctx: $.fn,
			fn: 'ready',
			run: (ctx) => this.render.update(`(${ctx.args[0].toString()})()`)
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
			run: (ctx) => AP.rewriteCheck(ctx.args[0]) && this.render.update(ctx.mid.origin.bind(ctx.mid.ctx, ...ctx.args), ctx.args[0], ctx.mid.id)
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
			runAfter: true,
			run: (ctx) => {
				const state = this
				const originShow = ctx.rs.show
				ctx.rs.show = function () {
					const ct = HMR.getCallStack(2)
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
			run: (ctx) => {
				this.watch.add(ctx.args[0], {
					change: () => ctx.mid.origin.call(ctx.mid.ctx, ...ctx.args),
				})
			}
		},
		// cache api data
		{
			id: 'AP.post',
			ctx: AP,
			fn: 'post',
			run: (ctx) => {
				if (ctx.args[1]?.direct_load) {
					this.apiCache.reset()
					return
				}
				const originCb = ctx.args[2]
				if (!originCb) return

				const cacheData = this.apiCache.get(ctx.args[0], ctx.args[1])
				if (cacheData) {
					ctx.next = false
					return originCb(cacheData)
				}
				
				ctx.args[2] = function (res) {
					if (res.good()) HMR.state.apiCache.add(ctx.args[0], ctx.args[1], res)
					originCb(res)
				}
			}
		},
	]
	
	this.init = function () {
		const state = this

		this.middlewares.forEach(m => {
			if (m.origin) return
			m.origin = m.ctx[m.fn]

			m.ctx[m.fn] = function (...args) {
				const runCtx = {t: this, args, rs: null, mid: m, next: true}
				if (m.runAfter) {
					runCtx.rs = m.origin.call(this, ...runCtx.args)
					m.run.call(state, runCtx)
				} else {
					m.run.call(state, runCtx)
					if (runCtx.next) {
						runCtx.rs = m.origin.call(this, ...runCtx.args)
					}
				}

				return runCtx.rs
			}

			HMR.assignObjectRecursive(m.ctx[m.fn], m.origin)
		})
	}
}

Engine.StageRender = function () {
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
			+objs.map(o => `'${o}': getFunctionByName('${o}')`).join(',\n\t')
			+'\n}\n'
			+js
			+'\nfor (const name in origin_objs) {\n'
			+'	const n_o = getFunctionByName(name)\n'
			+'	if (!n_o) continue\n'
			+'	HMR.assignObjectRecursive(origin_objs[name], n_o)\n'
			+'}\n'
			+objs.map(o => `if(origin_objs['${o}'] !== undefined) (${o}=origin_objs['${o}']) && HMR.state.watch.change(${o})`).join('\n')
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

Engine.ObjectWatcher = function () {
	this.objs = {}
	this.add = (obj, events) => {
		if (!obj) return
		this.objs[obj.constructor.name] = events
	}
	this.dispatch = (event, obj) => {
		if (!obj) return
		const name = obj.constructor.name
		if (this.objs[name] && this.objs[name][event]) {
			this.objs[name][event]()
		}
	}
	this.change = obj => this.dispatch('change', obj)
	this.reset = obj => this.dispatch('reset', obj)
}

Engine.APICache = function (ttl = 30) {
	this._data = {}
	this.ttl = ttl*60*1000
	this.add = (url, body, data) => {
		let d = this._data[url]
		if (!d) d = this._data[url] = {}
		d.body = JSON.parse(JSON.stringify(body))
		delete d.body?.__code
		delete d.body?.__otp
		delete d.body?.__sessionid
		d.data = data
		d.expires = Date.now() + this.ttl
	}
	this.get = (url, body) => {
		const d = this._data[url]
		if (!d) return null
		if (d.expires < Date.now()) return this.remove(url) && null
		if (HMR.isEqual(d.body, body)) return d.data
		return null
	}
	this.remove = () => delete this._data[url]
	this.reset = () => this._data = {}
}

export default Engine
