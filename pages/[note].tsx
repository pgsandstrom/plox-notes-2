import Head from 'next/head'
import FlipMove from 'react-flip-move'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { Note, NotePost } from 'types'
import { useState, useRef, useReducer } from 'react'
import useWebsocket from 'hooks/useWebsocket'
import NoteRow from 'components/noteRow'
import Button from 'components/button'
import { useDebounceObject } from 'hooks/useDebounce'
import { load } from 'server/noteController'
import getServerUrl from 'server/util/serverUrl'
import { LoadIcon, Check } from 'components/icons'
import { WEBSOCKET_COMMAND } from 'server/websocketConstants'

interface NoteProps {
  notes: Note[]
}

export const getServerSideProps: GetServerSideProps<NoteProps> = async (context) => {
  const data = await load(context.params!.note as string)
  return { props: { notes: data.data } }
}

const newNote = (): Note => {
  return {
    id: uuidv4(),
    text: '',
    checked: false,
  }
}

const saveNote = (noteid: string, notes: Note[]) => {
  return fetch(`${getServerUrl()}/api/${noteid}/save`, {
    method: 'POST',
    body: JSON.stringify(notes),
    credentials: 'same-origin',
  })
}

//TODO test url like /Per/Och/Maria/Handlar

interface NoteState {
  notes: Note[]
  history: Note[][]
  lastUserAction: number
}

interface SetNoteAction {
  type: 'SET_NOTE_ACTION'
  notes: Note[]
}

interface AddNoteAction {
  type: 'ADD_NOTE_ACTION'
  index: number
}

interface DeleteNoteAction {
  type: 'DELETE_NOTE_ACTION'
  index: number
}

interface EditNoteAction {
  type: 'EDIT_NOTE_ACTION'
  note: Note
  index: number
}

interface UndoAction {
  type: 'UNDO_ACTION'
}

type NoteAction = SetNoteAction | AddNoteAction | DeleteNoteAction | EditNoteAction | UndoAction

const NoteView = (props: NoteProps) => {
  const router = useRouter()
  const noteId = router.query.note as string

  const [ongoingSaves, setOngoingSaves] = useState(0)

  const [error, setError] = useState<string>()
  const [focusIndex, setFocusIndex] = useState<number>(props.notes.length - 1)
  const gainFocusRef = useRef<boolean>(true)

  const isNotesEmpty = (notes: Note[]): boolean => {
    return notes.length === 1 && notes[0].text === ''
  }

  const [noteState, dispatch] = useReducer(
    (state: NoteState, action: NoteAction) => {
      if (action.type === 'SET_NOTE_ACTION') {
        return {
          notes: action.notes,
          history: isNotesEmpty(state.notes) ? [...state.history] : [state.notes, ...state.history],
          lastUserAction: state.lastUserAction,
        }
      } else if (action.type === 'ADD_NOTE_ACTION') {
        return {
          notes: [
            ...state.notes.slice(0, action.index),
            newNote(),
            ...state.notes.slice(action.index, state.notes.length),
          ],
          history: [state.notes, ...state.history],
          lastUserAction: new Date().getTime(),
        }
      } else if (action.type === 'DELETE_NOTE_ACTION') {
        return {
          notes: [
            ...state.notes.slice(0, action.index),
            ...state.notes.slice(action.index + 1, state.notes.length),
          ],
          history: [state.notes, ...state.history],
          lastUserAction: new Date().getTime(),
        }
      } else if (action.type === 'EDIT_NOTE_ACTION') {
        return {
          notes: state.notes
            .map((note, index) => (index === action.index ? action.note : note))
            .sort((a, b) => {
              if (a.checked === b.checked) {
                return 0
              } else if (a.checked) {
                return -1
              } else {
                return 1
              }
            }),
          history: [state.notes, ...state.history],
          lastUserAction: new Date().getTime(),
        }
        //eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (action.type === 'UNDO_ACTION') {
        if (state.history.length === 0) {
          return state
        }
        return {
          notes: state.history[0],
          history: state.history.slice(1),
          lastUserAction: new Date().getTime(),
        }
      } else {
        return state
      }
    },
    {
      notes: props.notes,
      history: [],
      lastUserAction: 0,
    },
  )

  useDebounceObject(
    noteState.lastUserAction,
    () => {
      if (noteState.lastUserAction > 0) {
        saveThroughWebsocket()
      }
    },
    0, // we don't debounce currently, so others viewing the document gets updated immediately.
  )

  const setNotes = (notes: Note[]) => {
    dispatch({
      type: 'SET_NOTE_ACTION',
      notes,
    })
  }

  const addNote = (index: number) => {
    dispatch({
      type: 'ADD_NOTE_ACTION',
      index,
    })
    setFocusIndex(index)
    gainFocusRef.current = true
  }

  const deleteNote = (index: number) => {
    dispatch({
      type: 'DELETE_NOTE_ACTION',
      index,
    })
    if (index > 0) {
      setFocusIndex(index - 1)
      gainFocusRef.current = true
    }
  }

  const editNote = (note: Note, index: number) => {
    dispatch({
      type: 'EDIT_NOTE_ACTION',
      note,
      index,
    })
  }

  const undo = () => {
    dispatch({
      type: 'UNDO_ACTION',
    })
  }

  const hasFocused = () => (gainFocusRef.current = false)

  const saveThroughApi = async () => {
    setOngoingSaves((os) => os + 1)
    await saveNote(noteId, noteState.notes)
    setOngoingSaves((os) => os - 1)
  }

  const websocketSaveComplete = () => {
    setOngoingSaves((os) => os - 1)
  }

  const websocketEmit = useWebsocket(noteId, setError, setNotes, websocketSaveComplete)

  const saveThroughWebsocket = () => {
    setOngoingSaves((os) => os + 1)
    const notePost: NotePost = { id: noteId, notes: noteState.notes }
    websocketEmit(WEBSOCKET_COMMAND.POST, notePost)
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Head>
        <title>{noteId}</title>
      </Head>
      <div
        style={{
          display: 'flex',
          flex: '1 0 auto',
          flexDirection: 'column',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {error !== undefined && (
          <div
            style={{
              position: 'fixed',
              width: '100%',
              maxWidth: '500px',
              fontSize: '2em',
              textAlign: 'center',
              background: 'red',
            }}
          >
            {error}
          </div>
        )}
        <div style={{ fontSize: '2em', textAlign: 'center', margin: '10px 0' }}>{noteId}</div>
        <div style={{ flex: '1 0 0' }}>
          <FlipMove duration={200}>
            {noteState.notes.map((note, index) => (
              <NoteRow
                key={note.id}
                note={note}
                index={index}
                focus={index === focusIndex && gainFocusRef.current === true}
                hasFocused={hasFocused}
                disabled={error !== undefined}
                editNote={editNote}
                addNote={addNote}
                deleteNote={deleteNote}
              />
            ))}
          </FlipMove>
        </div>
        <footer style={{ display: 'flex', flex: '0 0 auto', marginBottom: '1px' }}>
          <Button
            style={{ flex: '1 0 0', height: '50px' }}
            onClick={() => addNote(noteState.notes.length)}
          >
            Add
          </Button>
          <Button style={{ flex: '1 0 0', height: '50px' }} onClick={undo}>
            Undo
          </Button>
          <Button style={{ flex: '1 0 0', height: '50px' }} onClick={saveThroughApi}>
            <span style={{ paddingRight: '5px' }}>Save</span>
            {ongoingSaves > 0 && <LoadIcon style={{ width: '16px' }} />}
            {ongoingSaves === 0 && <Check style={{ width: '16px' }} />}
          </Button>
        </footer>
      </div>
      <style jsx>{`
        .plox {
          flex: 1 0 0;
        }
      `}</style>
    </div>
  )
}

export default NoteView
