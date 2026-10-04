# Actions

Leftovers from the big update. Roughly ordered by importance within each section.

## Bugs

- [ ] **Save button doesn't broadcast.** It saves through REST, so other clients on the same note never get the update. The websocket already autosaves on every change, so either remove the button or make it emit over the websocket.

## Simplifications

- [ ] **Drop manual memoization.** The React Compiler is enabled, so the `useCallback(..., [dispatch])` wrappers in `pages/[note].tsx` and the custom `memo` comparator in NoteRow should be redundant. Verify that rendering behaves the same.

## Small and cosmetic

- [ ] `pages/_app.tsx`: `user-scalable=no` blocks pinch-to-zoom (accessibility).
- [ ] README: "have not received any love for several years" is no longer true.

## Later (touches production data, do deliberately)

- [ ] Make `id` a `PRIMARY KEY` instead of a nullable `UNIQUE` in `note`/`note_meta`.
- [ ] One-off migration to set `indentation` on old notes, then drop `NoteDb` and `noteDbToNote`.
- [ ] Upgrade Postgres 16 (requires a dump and restore of the volume).
