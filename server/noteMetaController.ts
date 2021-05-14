import { querySingle, SQL, query } from './util/db'
import { NoteMeta } from 'types'
import { v4 as uuidv4 } from 'uuid'

export const loadOrShowNewMeta = async (id: string) => {
  const queryResult = await loadMeta(id)
  if (queryResult) {
    return queryResult
  } else {
    return {
      data: [
        {
          id: uuidv4(),
          text: '',
          checked: false,
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
  // eslint-disable-next-line
  if (notes === null || notes === undefined || !Array.isArray(notes)) {
    throw new Error(`save note_meta received wrong data: ${JSON.stringify(notes)}`)
  }
  // eslint-disable-next-line
  if (notes.length > 0 && notes[0].text === undefined) {
    throw new Error(`save note_meta received wrong row data: ${JSON.stringify(notes)}`)
  }

  const queryResult =
    await query(SQL`INSERT INTO note_meta(id, data) VALUES(${id}, ${JSON.stringify(notes)})
  ON CONFLICT(id) DO UPDATE SET data=${JSON.stringify(notes)}::jsonb`)
  return queryResult
}
