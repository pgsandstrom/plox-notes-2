# PloxNotes2

A minimalistic and fast checklist app.

This is the followup to the ancient PloxNotes project. This uses next.js instead of home made server side rendering.

It uses a custom server to enable websocket usage on the server. In hindsight, it would have been better to use default server and simply have websocket logic in a separate node process. But you know, what's done is done. No big deal.

This project is a bit shit codewise and have not received any love for several years. But it works. Thats something.

## Getting Started

To start dev mode, start the database in docker and then the dev server:

```bash
pnpm install
pnpm dev-database
pnpm dev
```

The server connects to postgres on localhost:5432. Set `PGHOST`/`PGPORT` to point it somewhere else.

Before pushing, `pnpm validate` runs typecheck and lint, and `pnpm knip` finds unused files, exports and dependencies.

## release

Just run `pnpm docker-build && pnpm docker-up` and you are good to go.
