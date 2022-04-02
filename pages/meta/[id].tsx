import Head from 'next/head'
import FlipMove from 'react-flip-move'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { NoteMeta } from 'types'
import NoteMetaRow from 'components/noteMetaRow'
import React, { useReducer, useRef, useState } from 'react'
import Button from 'components/button'
import getServerUrl from 'server/util/serverUrl'
import { Check, LoadIcon } from 'components/icons'
import { loadOrShowNewMeta } from 'server/noteMetaController'
import { FocusGain } from 'pages/[note]'

interface NoteMetaProps {
  metaList: NoteMeta[]
}

export const getServerSideProps: GetServerSideProps<NoteMetaProps> = async (context) => {
  const data = await loadOrShowNewMeta(context.params!.id as string)
  return { props: { metaList: data.data } }
}

const newMeta = (text?: string): NoteMeta => {
  return {
    id: uuidv4(),
    text: text ?? '',
  }
}

interface NoteMetaState {
  metaList: NoteMeta[]
  history: NoteMeta[][]
  lastUserAction: number
}

interface SetMetaAction {
  type: 'SET_META_ACTION'
  notes: NoteMeta[]
}

interface AddMetaAction {
  type: 'ADD_META_ACTION'
  index: number
  text?: string
}

interface DeleteMetaAction {
  type: 'DELETE_META_ACTION'
  index: number
}

interface EditMetaAction {
  type: 'EDIT_META_ACTION'
  note: NoteMeta
  index: number
}

interface UndoAction {
  type: 'UNDO_ACTION'
}

type MetaAction = SetMetaAction | AddMetaAction | DeleteMetaAction | EditMetaAction | UndoAction

const NoteMetaView = (props: NoteMetaProps) => {
  const router = useRouter()
  const noteMetaId = router.query.id as string

  const [editing, setEditing] = useState(false)
  const [ongoingSaves, setOngoingSaves] = useState(0)

  const [error, setError] = useState<string>()
  const gainFocusRef = useRef<FocusGain | undefined>({
    index: props.metaList.length - 1,
    position: 'end',
  })

  const isNotesEmpty = (notes: NoteMeta[]): boolean => {
    return notes.length === 1 && notes[0].text === ''
  }

  const [noteState, dispatch] = useReducer(
    (state: NoteMetaState, action: MetaAction): NoteMetaState => {
      if (action.type === 'SET_META_ACTION') {
        return {
          metaList: action.notes,
          history: isNotesEmpty(state.metaList)
            ? [...state.history]
            : [state.metaList, ...state.history],
          lastUserAction: state.lastUserAction,
        }
      } else if (action.type === 'ADD_META_ACTION') {
        return {
          metaList: [
            ...state.metaList.slice(0, action.index),
            newMeta(action.text),
            ...state.metaList.slice(action.index, state.metaList.length),
          ],
          history: [state.metaList, ...state.history],
          lastUserAction: new Date().getTime(),
        }
      } else if (action.type === 'DELETE_META_ACTION') {
        return {
          metaList: [
            ...state.metaList.slice(0, action.index),
            ...state.metaList.slice(action.index + 1, state.metaList.length),
          ],
          history: [state.metaList, ...state.history],
          lastUserAction: new Date().getTime(),
        }
      } else if (action.type === 'EDIT_META_ACTION') {
        return {
          metaList: state.metaList.map((note, index) =>
            index === action.index ? action.note : note,
          ),
          history: [state.metaList, ...state.history],
          lastUserAction: new Date().getTime(),
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (action.type === 'UNDO_ACTION') {
        if (state.history.length === 0) {
          return state
        }
        return {
          metaList: state.history[0],
          history: state.history.slice(1),
          lastUserAction: new Date().getTime(),
        }
      } else {
        return state
      }
    },
    {
      metaList: props.metaList,
      history: [],
      lastUserAction: 0,
    },
  )

  // const setNotes = (notes: NoteMeta[]) => {
  //   dispatch({
  //     type: 'SET_META_ACTION',
  //     notes,
  //   })
  // }

  const addNote = (index: number, text?: string) => {
    dispatch({
      type: 'ADD_META_ACTION',
      index,
      text,
    })
    gainFocusRef.current = {
      index,
      position: 'start',
    }
  }

  const deleteNote = (index: number) => {
    dispatch({
      type: 'DELETE_META_ACTION',
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

  const editNote = (note: NoteMeta, index: number) => {
    if (note.text.includes('\n')) {
      const [original, newText] = note.text.split('\n')
      note.text = original
      addNote(index + 1, newText)
    }
    dispatch({
      type: 'EDIT_META_ACTION',
      note,
      index,
    })
  }

  const setSpecificFocus = (index: number, char: number) => {
    gainFocusRef.current = {
      index: index,
      position: char,
    }
  }

  const undo = () => {
    dispatch({
      type: 'UNDO_ACTION',
    })
  }

  const saveThroughApi = async () => {
    setOngoingSaves((os) => os + 1)
    setEditing(false)
    try {
      const result = await fetch(`${getServerUrl()}/api/meta/${noteMetaId}/save`, {
        method: 'POST',
        body: JSON.stringify(noteState.metaList),
        credentials: 'same-origin',
      })
      if (result.status >= 200 && result.status < 300) {
        setError(undefined)
      } else {
        setError('Save failed')
      }
    } catch (e) {
      setError('Save failed')
    }
    setOngoingSaves((os) => os - 1)
  }

  // TODO make us get updates through websocket

  return (
    <div style={{ display: 'flex', width: '100vw', maxWidth: '100%', height: '100%' }}>
      <Head>
        <title>{noteMetaId}</title>
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
        <div style={{ fontSize: '2em', textAlign: 'center', margin: '10px 0' }}>{noteMetaId}</div>
        <FlipMove
          duration={200}
          style={{ flex: '1 0 0', overflowY: 'auto' }}
          leaveAnimation={false}
        >
          {noteState.metaList.map((noteMeta, index) => (
            <NoteMetaRow
              key={noteMeta.id}
              previousNote={noteState.metaList[index - 1]}
              note={noteMeta}
              index={index}
              gainFocusRef={gainFocusRef}
              disabled={false}
              editNote={editNote}
              deleteNote={deleteNote}
              setSpecificFocus={setSpecificFocus}
              isEditing={editing}
            />
          ))}
        </FlipMove>
        <footer style={{ display: 'flex', flex: '0 0 auto', marginBottom: '1px' }}>
          {(editing || ongoingSaves > 0) && (
            <>
              <Button
                style={{ flex: '1 0 0', height: '50px' }}
                onClick={() => addNote(noteState.metaList.length)}
                disabled={ongoingSaves > 0}
              >
                Add
              </Button>
              <Button
                style={{ flex: '1 0 0', height: '50px' }}
                onClick={undo}
                disabled={ongoingSaves > 0}
              >
                Undo
              </Button>
            </>
          )}
          {editing || ongoingSaves > 0 ? (
            <Button
              style={{ flex: '1 0 0', height: '50px' }}
              onClick={saveThroughApi}
              disabled={ongoingSaves > 0}
            >
              <span style={{ paddingRight: '5px' }}>Save</span>
              {ongoingSaves > 0 && <LoadIcon style={{ width: '16px' }} />}
              {ongoingSaves === 0 && <Check style={{ width: '16px' }} />}
            </Button>
          ) : (
            <Button style={{ flex: '1 0 0', height: '50px' }} onClick={() => setEditing(true)}>
              <span style={{ paddingRight: '5px' }}>Edit</span>
            </Button>
          )}
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

export default NoteMetaView
