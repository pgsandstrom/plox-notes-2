import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import websocket from './websocket'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true)
      handle(req, res, parsedUrl).catch(() => console.error('failed to handle request'))
    })

    const ioServer = new Server(server)
    websocket(ioServer)

    // There seem to be something weird with loading .env.local in next.js.
    // It seems to be undefined before next.js server is initiated?
    // So load .env variables as late as possible
    const port = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 3000

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`)
    })
  })
  .catch(() => console.error('failed to start server'))
