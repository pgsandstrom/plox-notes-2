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

    const port = 3000

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}. NODE_ENV is ${process.env.NODE_ENV}`)
    })
  })
  .catch(() => console.error('failed to start server'))
