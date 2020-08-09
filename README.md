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

But you will also need a postgresql database to connect to. Check out `example.env.local` for what variables you need to configure. Then check out `create-tables.sql` and `create-database.sql`, this is how you create the database.

Then open [http://localhost:3000](http://localhost:3000) with your browser and hopefully everything works.
