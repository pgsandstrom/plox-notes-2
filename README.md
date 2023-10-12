# PloxNotes2

A minimalistic and fast checklist app.

This is the followup to the ancient PloxNotes project. This uses next.js instead of home made server side rendering.

It uses a custom server to enable websocket usage on the server. In hindsight, it would have been better to use default server and simply have websocket logic in a separate node process. But you know, what's done is done. No big deal.

## Getting Started

To start dev mode:

```bash
npm install
npm run dev
```

Prod you ask? Well we use docker. So you know.
