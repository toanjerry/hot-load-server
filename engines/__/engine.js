import path from 'path'
import Back from './back.js'

const __dirname = path.resolve(import.meta.dirname)

export default { back: Back, front: path.resolve(__dirname, 'front.js') }
