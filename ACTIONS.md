# Actions

Leftovers from the big update. Roughly ordered by importance within each section.

## Bugs

- [ ] **Multi-line paste loses lines.** `split("\n")` destructures only two parts in the `EDIT_NOTE_ACTION` reducer (`pages/[note].tsx`) and in `editNote` (`pages/meta/[id].tsx`). Pasting 5 lines gives 2 rows. Split into N rows.
- [x] **Save button spins forever on failure.** `saveThroughApi` in `pages/[note].tsx` has no error handling and ignores `res.ok`. The spinner now always stops. On failure, the button turns red and shows a cross until the next save.
- [ ] **Save button doesn't broadcast.** It saves through REST, so other clients on the same note never get the update. The websocket already autosaves on every change, so either remove the button or make it emit over the websocket.
- [x] **Undo history is unbounded.** Every keystroke stores a full snapshot. Cap it (e.g. 100 entries) in both reducers.
- [x] **`isNotesIdentical` ignores `indentation`.** Remote indentation-only changes don't create a history entry.
- [ ] **Meta `editNote` mutates its argument** (`note.text = original`) and dispatches twice, giving two undo entries per newline. Do the split in the reducer like the note page.
- [x] **Note ids are not URL-encoded.** `router.push("/[note]", `/${id}`)` in `pages/index.tsx` and `href={`/${note.text}`}` in `components/noteMetaRow.tsx` break on `?`, `#`, `/`. Use `encodeURIComponent`, and the single-argument `router.push`.
- [ ] **Alt+←/→ (browser back/forward) is blocked on the whole note page.** `useKey` calls `preventDefault` before NoteRow checks focus. Fixed by the `useKey` simplification below.

## Dead code

- [x] Delete `pages/api/[note].ts` (its own comment says it's unused).
- [x] Remove `websocketSaveComplete` (empty, with commented-out code) and the server's unused `"ok"` emit. Also the commented-out `setOngoingSaves` in the save effect.
- [x] Meta page: remove the commented-out `setNotes`, the unused `SET_META_ACTION` branch, and `disabled={false}`.
- [x] `loadOrShowNewMeta` returns `checked: false`, which isn't part of `NoteMeta`.
- [x] Remove `// export default NoteRow` at the end of `components/noteRow.tsx`.
- [x] Remove the commented-out import at the top of `server/websocket.ts`.
- [x] `server/util/db.ts`: remove the int8 type parser (no count queries) and the "null might screw us" comment.
- [x] `.dockerignore`: `npm-debug.log` is an npm leftover.
- [x] `knip.config.ts`: knip reports `entry: ["server/index.ts!"]` as redundant. **Won't fix:** the hint is wrong, because `knip --production` reports `server/` as unused without that entry.

## Simplifications

- [ ] **Replace `useKey` with the textarea's `onKeyDown` in NoteRow.** It already has one. This fixes the Alt+arrow bug, resolves the "one root useKey" TODO, removes one document listener per row, and lets `hooks/useKey.ts` be deleted.
- [ ] **Use socket.io rooms in `server/websocket.ts`.** `socket.join(noteId)` and `socket.to(id).emit(...)` replace the hand-written `activeSockets` map and filter chain.
- [ ] **Drop manual memoization.** The React Compiler is enabled, so the `useCallback(..., [dispatch])` wrappers in `pages/[note].tsx` and the custom `memo` comparator in NoteRow should be redundant. Verify that rendering behaves the same.
- [x] **Move `FocusGain` to `types/`.** Components currently import it from a page file.
- [x] **Upsert with `EXCLUDED.data`** in `saveNote`/`saveMeta` instead of stringifying the JSON twice.

## Ops and robustness

- [x] `server/index.ts`: log the actual error and `process.exit(1)` when startup fails. The request-handler `.catch` also throws the error away.
- [x] Add `init: true` to the `web` service in `docker-compose.yml`. Without it, node runs as PID 1 and ignores SIGTERM, so every release waits 10 seconds before the old container is killed.
- [x] `server/websocket.ts`: `JSON.stringify(e)` on an `Error` prints `{}`, and the save `.catch` doesn't log the error at all. The "TODO send out error to client" is stale; that already happens.

## Small and cosmetic

- [x] `pages/index.tsx`: `onKeyPress` is deprecated; use `onKeyDown`.
- [ ] `public/site.webmanifest` says "PloxNotes"; the site calls itself "Bös". (Set on purpose in the "polish" commit, left as is.)
- [ ] `pages/_app.tsx`: `user-scalable=no` blocks pinch-to-zoom (accessibility).
- [x] `components/checkbox.tsx`: add `role="checkbox"` and `aria-checked`, strip the FontAwesome `data-*` attributes, and move the interface below the import.
- [ ] README: "have not received any love for several years" is no longer true.

## Later (touches production data, do deliberately)

- [ ] Make `id` a `PRIMARY KEY` instead of a nullable `UNIQUE` in `note`/`note_meta`.
- [ ] One-off migration to set `indentation` on old notes, then drop `NoteDb` and `noteDbToNote`.
- [ ] Upgrade Postgres 16 (requires a dump and restore of the volume).
