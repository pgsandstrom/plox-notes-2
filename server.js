const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("custom server 1 ");
app.prepare().then(() => {
  createServer((req, res) => {
    // const parsedUrl = new URL(req.url, "http://w.w");
    // const { pathname, query } = parsedUrl;

    // if (pathname === "/a") {
    //   app.render(req, res, "/a", query);
    // } else if (pathname === "/b") {
    //   app.render(req, res, "/b", query);
    // } else {
    console.log("custom server");
    handle(req, res, req.url);
    // }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
