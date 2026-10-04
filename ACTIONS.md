# Actions

Leftovers from the big update. Roughly ordered by importance within each section.

## Bugs

- [ ] **Save button doesn't broadcast.** It saves through REST, so other clients on the same note never get the update. The websocket already autosaves on every change, so either remove the button or make it emit over the websocket.

## Small and cosmetic

- [ ] `pages/_app.tsx`: `user-scalable=no` blocks pinch-to-zoom (accessibility).

## Later (touches production data, do deliberately)

- [ ] Make `id` a `PRIMARY KEY` instead of a nullable `UNIQUE` in `note`/`note_meta`.
- [ ] One-off migration to set `indentation` on old notes, then drop `NoteDb` and `noteDbToNote`.
- [ ] Upgrade Postgres 16 (requires a dump and restore of the volume).
