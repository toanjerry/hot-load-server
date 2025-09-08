import { createServer } from "./src/index.js"
// import config from "./hot.config.js"

const events = {
	onExit: (hot) => hot.ws.broadcast({ reload: [] })
}

const hot = createServer(null, events)
