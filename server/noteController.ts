import { querySingle, SQL, query } from './util/db'
import { Note, NoteDb } from 'types'
import { v4 as uuidv4 } from 'uuid'

export const loadOrShowNewNote = async (id: string): Promise<Note[]> => {
  const queryResult = await loadNote(id)
  if (queryResult) {
    return queryResult
  } else {
    return [
      {
        id: uuidv4(),
        text: '',
        checked: false,
        indentation: 0,
      },
    ]
  }
}

export const loadNote = async (id: string): Promise<Note[] | undefined> => {
  const queryResult = await querySingle<{ data: NoteDb[] }>(
    SQL`SELECT data FROM note WHERE id = ${id}`,
  )
  if (queryResult?.data) {
    return noteDbToNote(queryResult.data)
  } else {
    return undefined
  }
}

const noteDbToNote = (data: NoteDb[]): Note[] => {
  return data.map((note) => {
    return {
      ...note,
      indentation: note.indentation ?? 0,
    }
  })
}

export const saveNote = async (id: string, notes: Note[]) => {
  // eslint-disable-next-line
  if (notes === null || notes === undefined || !Array.isArray(notes)) {
    throw new Error(`save note received wrong data: ${JSON.stringify(notes)}`)
  }
  // eslint-disable-next-line
  if (notes.length > 0 && notes[0].text === undefined) {
    throw new Error(`save note received wrong row data: ${JSON.stringify(notes)}`)
  }

  const queryResult = await query(SQL`INSERT INTO note(id, data) VALUES(${id}, ${JSON.stringify(
    notes,
  )})
  ON CONFLICT(id) DO UPDATE SET data=${JSON.stringify(notes)}::jsonb`)
  return queryResult
}
