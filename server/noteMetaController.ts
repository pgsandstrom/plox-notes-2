import { v4 as uuidv4 } from "uuid"

import type { NoteMeta } from "../types/index.ts"
import { SQL, query, querySingle } from "./util/db.ts"

export const loadOrShowNewMeta = async (id: string) => {
  const queryResult = await loadMeta(id)
  if (queryResult) {
    return queryResult
  } else {
    return {
      data: [
        {
          id: uuidv4(),
          text: "",
        },
      ],
    }
  }
}

export const loadMeta = async (id: string) => {
  const queryResult = await querySingle<{ data: NoteMeta[] }>(
    SQL`SELECT data FROM note_meta WHERE id = ${id}`,
  )
  return queryResult
}

export const saveMeta = async (id: string, notes: NoteMeta[]) => {
  // runtime validation of client input, the types can't be trusted here
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (notes === null || notes === undefined || !Array.isArray(notes)) {
    throw new Error(`save note_meta received wrong data: ${JSON.stringify(notes)}`)
  }
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (notes.length > 0 && notes[0].text === undefined) {
    throw new Error(`save note_meta received wrong row data: ${JSON.stringify(notes)}`)
  }

  const queryResult =
    await query(SQL`INSERT INTO note_meta(id, data) VALUES(${id}, ${JSON.stringify(notes)})
  ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data`)
  return queryResult
}
