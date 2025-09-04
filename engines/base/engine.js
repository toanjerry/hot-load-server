import path from 'path'
import Back from './back.js'

export default { back: Back, front: path.resolve(import.meta.dirname, 'front.js') }
