import { createServer } from "http";
import { parse } from "url";
import next from "next";
import socketio from "socket.io";
import websocket from "./websocket";

const port = parseInt(process.env.PORT as string, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = socketio.listen(server);
  websocket(io);

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
