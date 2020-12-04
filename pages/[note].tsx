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
import { loadOrShowNew } from 'server/noteController'
import getServerUrl from 'server/util/serverUrl'
import { LoadIcon, Check } from 'components/icons'
import { WEBSOCKET_COMMAND } from 'server/websocketConstants'

interface NoteProps {
  notes: Note[]
}

export const getServerSideProps: GetServerSideProps<NoteProps> = async (context) => {
  const data = await loadOrShowNew(context.params!.note as string)
  return { props: { notes: data.data } }
}

const newNote = (checked: boolean, text?: string): Note => {
  return {
    id: uuidv4(),
    text: text ?? '',
    checked,
  }
}

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
  text?: string
  checked?: boolean
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

export interface FocusGain {
  index: number
  position: 'start' | 'end'
}

const NoteView = (props: NoteProps) => {
  const router = useRouter()
  const noteId = router.query.note as string

  const [ongoingSaves, setOngoingSaves] = useState(0)

  const [error, setError] = useState<string>()
  const gainFocusRef = useRef<FocusGain>({
    index: props.notes.length - 1,
    position: 'end',
  })

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
        let checked
        if (action.checked !== undefined) {
          checked = action.checked
        } else {
          checked =
            state.notes.length > 0 && state.notes.length > action.index - 1
              ? state.notes[action.index - 1].checked
              : false
        }
        return {
          notes: [
            ...state.notes.slice(0, action.index),
            newNote(checked, action.text),
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
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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

  const setNotes = (notes: Note[]) => {
    dispatch({
      type: 'SET_NOTE_ACTION',
      notes,
    })
  }

  const addNote = (index: number, text?: string, checked?: boolean) => {
    dispatch({
      type: 'ADD_NOTE_ACTION',
      index,
      text,
      checked,
    })
    gainFocusRef.current = {
      index,
      position: 'start',
    }
  }

  const deleteNote = (index: number) => {
    dispatch({
      type: 'DELETE_NOTE_ACTION',
      index,
    })
    // Only set the focus if we currently focus a note row input
    // This is to avoid just clicking the delete button and the onscreen keyboard showing up on mobile
    if (
      index > 0 &&
      document.activeElement &&
      document.activeElement.className.includes('note-row-input')
    ) {
      gainFocusRef.current = {
        index: index - 1,
        position: 'end',
      }
    }
  }

  const editNote = (note: Note, index: number) => {
    if (note.text.includes('\n')) {
      const [original, newText] = note.text.split('\n')
      note.text = original
      addNote(index + 1, newText, note.checked)
    }
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

  const saveThroughApi = async () => {
    setOngoingSaves((os) => os + 1)
    await fetch(`${getServerUrl()}/api/${noteId}/save`, {
      method: 'POST',
      body: JSON.stringify(noteState.notes),
      credentials: 'same-origin',
    })
    setOngoingSaves((os) => os - 1)
  }

  const websocketSaveComplete = () => {
    setOngoingSaves((os) => os - 1)
  }

  const onConnect = () => {
    setError(undefined)
    setOngoingSaves(0)
  }

  const websocketEmit = useWebsocket(noteId, setError, setNotes, websocketSaveComplete, onConnect)

  const saveThroughWebsocket = () => {
    if (noteState.lastUserAction > 0) {
      setOngoingSaves((os) => os + 1)
      const notePost: NotePost = { id: noteId, notes: noteState.notes }
      websocketEmit(WEBSOCKET_COMMAND.POST, notePost)
    }
  }

  useDebounceObject(
    noteState.lastUserAction,
    saveThroughWebsocket,
    0, // we don't debounce currently, so others viewing the document gets updated immediately.
  )

  return (
    <div style={{ display: 'flex', width: '100vw', maxWidth: '100%', height: '100%' }}>
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
        <FlipMove duration={200} style={{ flex: '1 0 0', overflowY: 'auto' }} disableAllAnimations>
          {noteState.notes.map((note, index) => (
            <NoteRow
              key={note.id}
              previousNote={noteState.notes[index - 1]}
              note={note}
              index={index}
              gainFocusRef={gainFocusRef}
              disabled={error !== undefined}
              editNote={editNote}
              deleteNote={deleteNote}
            />
          ))}
        </FlipMove>
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
      <style jsx global>{`
        html {
          overflow-y: hidden;
        }
      `}</style>
    </div>
  )
}

export default NoteView
