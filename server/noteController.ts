import { querySingle, SQL, query } from './util/db'
import { Note } from 'types'
import { v4 as uuidv4 } from 'uuid'

export const loadOrShowNew = async (id: string) => {
  const queryResult = await load(id)
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

export const load = async (id: string) => {
  const queryResult = await querySingle<{ data: Note[] }>(
    SQL`SELECT data FROM note WHERE id = ${id}`,
  )
  return queryResult
}

export const save = async (id: string, notes: Note[]) => {
  // eslint-disable-next-line
  if (notes === null || notes === undefined || !Array.isArray(notes)) {
    throw new Error(`save received wrong data: ${JSON.stringify(notes)}`)
  }
  // eslint-disable-next-line
  if (notes.length > 0 && notes[0].text === undefined) {
    throw new Error(`save received wrong row data: ${JSON.stringify(notes)}`)
  }

  const queryResult = await query(SQL`INSERT INTO note(id, data) VALUES(${id}, ${JSON.stringify(
    notes,
  )})
  ON CONFLICT(id) DO UPDATE SET data=${JSON.stringify(notes)}::jsonb`)
  return queryResult
}
