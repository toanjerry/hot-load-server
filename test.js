import { createServer } from "./src/index.js"

const hot = createServer(null, (hot) => hot.ws.broadcast({ reload: [] }))
