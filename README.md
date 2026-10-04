# PloxNotes2

A minimalistic and fast checklist app.

This is the followup to the ancient PloxNotes project. This uses next.js instead of home made server side rendering.

It uses a custom server to enable websocket usage on the server. In hindsight, it would have been better to use default server and simply have websocket logic in a separate node process. But you know, what's done is done. No big deal.

## Getting Started

You need Node 24, pnpm and Docker.

```bash
pnpm install
pnpm dev-database
pnpm dev
```

Then open http://localhost:3000.

`pnpm dev-database` starts Postgres 16 in a docker container in the background, on localhost:5433 (not the default 5432, so it does not collide with other projects). The first time it starts, it creates the `ploxnotes` database and runs `db/create-tables.sql`. The data is kept in a docker volume, so it survives restarts. You only need to run it again after a reboot or after stopping it.

`pnpm dev` starts the custom server with Next.js in dev mode and connects to the database on port 5433. It restarts by itself when something in `server/` or `types/` changes.

To use another port, set `PGPORT` for both commands, e.g. `PGPORT=5555 pnpm dev-database` and `PGPORT=5555 pnpm dev`.

To stop the database: `docker compose -f docker-compose-dev.yml down`. Add `-v` to also delete the data.

Before pushing, `pnpm validate` runs typecheck and lint, and `pnpm knip` finds unused files, exports and dependencies.

## release

Run `pnpm release` on the server. It builds the image and (re)starts the app and database with docker compose. The app is exposed on port 8088.
