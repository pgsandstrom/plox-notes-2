import { createServer } from "node:http"

import next from "next"
import { Server } from "socket.io"

import websocket from "./websocket.ts"

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

await app.prepare()

const server = createServer((req, res) => {
  handle(req, res).catch((e: unknown) => console.error("failed to handle request", e))
})

websocket(new Server(server))

const port = 3000

server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}. NODE_ENV is ${process.env.NODE_ENV}`)
})
