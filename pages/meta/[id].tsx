import type { GetServerSideProps } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useReducer, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import Button from "../../components/button.tsx"
import { Check, LoadIcon } from "../../components/icons.tsx"
import NoteMetaRow from "../../components/noteMetaRow.tsx"
import useAnimateOrder from "../../hooks/useAnimateOrder.ts"
import { loadOrShowNewMeta } from "../../server/noteMetaController.ts"
import type { FocusGain, NoteMeta } from "../../types/index.ts"

interface NoteMetaProps {
  metaList: NoteMeta[]
}

export const getServerSideProps: GetServerSideProps<NoteMetaProps> = async (context) => {
  const data = await loadOrShowNewMeta(context.params!.id as string)
  return { props: { metaList: data.data } }
}

const newMeta = (text = ""): NoteMeta => {
  return {
    id: uuidv4(),
    text,
  }
}

interface NoteMetaState {
  metaList: NoteMeta[]
  history: NoteMeta[][]
  lastUserAction: number
}

interface AddMetaAction {
  type: "ADD_META_ACTION"
  index: number
}

interface DeleteMetaAction {
  type: "DELETE_META_ACTION"
  index: number
}

interface EditMetaAction {
  type: "EDIT_META_ACTION"
  note: NoteMeta
  index: number
}

interface UndoAction {
  type: "UNDO_ACTION"
}

type MetaAction = AddMetaAction | DeleteMetaAction | EditMetaAction | UndoAction

const MAX_HISTORY = 100

const pushHistory = (state: NoteMetaState) => [
  state.metaList,
  ...state.history.slice(0, MAX_HISTORY - 1),
]

const NoteMetaView = (props: NoteMetaProps) => {
  const router = useRouter()
  const noteMetaId = router.query.id as string

  const [editing, setEditing] = useState(false)
  const [ongoingSaves, setOngoingSaves] = useState(0)

  const [error, setError] = useState<string>()
  const gainFocusRef = useRef<FocusGain | undefined>({
    index: props.metaList.length - 1,
    position: "end",
  })

  const [noteState, dispatch] = useReducer(
    (state: NoteMetaState, action: MetaAction): NoteMetaState => {
      if (action.type === "ADD_META_ACTION") {
        return {
          metaList: [
            ...state.metaList.slice(0, action.index),
            newMeta(),
            ...state.metaList.slice(action.index, state.metaList.length),
          ],
          history: pushHistory(state),
          lastUserAction: new Date().getTime(),
        }
      } else if (action.type === "DELETE_META_ACTION") {
        return {
          metaList: [
            ...state.metaList.slice(0, action.index),
            ...state.metaList.slice(action.index + 1, state.metaList.length),
          ],
          history: pushHistory(state),
          lastUserAction: new Date().getTime(),
        }
      } else if (action.type === "EDIT_META_ACTION") {
        // a newline (enter or a multi-line paste) splits the row, every extra line becomes a new row
        const [firstLine, ...newLines] = action.note.text.split(/\r?\n/)
        return {
          metaList: [
            ...state.metaList.slice(0, action.index),
            { ...action.note, text: firstLine },
            ...newLines.map((text) => newMeta(text)),
            ...state.metaList.slice(action.index + 1),
          ],
          history: pushHistory(state),
          lastUserAction: new Date().getTime(),
        }
        // oxlint-disable-next-line typescript/no-unnecessary-condition
      } else if (action.type === "UNDO_ACTION") {
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

  const addNote = (index: number) => {
    dispatch({
      type: "ADD_META_ACTION",
      index,
    })
    gainFocusRef.current = {
      index,
      position: "start",
    }
  }

  const deleteNote = (index: number) => {
    dispatch({
      type: "DELETE_META_ACTION",
      index,
    })
    // Only set the focus if we currently focus a note row input
    // This is to avoid just clicking the delete button and the onscreen keyboard showing up on mobile
    if (
      index > 0 &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.dataset.noteInput !== undefined
    ) {
      gainFocusRef.current = {
        index: index - 1,
        position: "end",
      }
    }
  }

  const editNote = (note: NoteMeta, index: number) => {
    // newlines split the row (see the reducer), focus goes to the last new row.
    // After enter the cursor belongs at its start, after a multi-line paste at its end.
    const newLineCount = note.text.split(/\r?\n/).length - 1
    if (newLineCount > 0) {
      gainFocusRef.current = {
        index: index + newLineCount,
        position: newLineCount === 1 ? "start" : "end",
      }
    }
    dispatch({
      type: "EDIT_META_ACTION",
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
      type: "UNDO_ACTION",
    })
  }

  const saveThroughApi = async () => {
    setOngoingSaves((os) => os + 1)
    setEditing(false)
    const saved = await fetch(`/api/meta/${noteMetaId}/save`, {
      method: "POST",
      body: JSON.stringify(noteState.metaList),
    }).then(
      (result) => result.ok,
      () => false,
    )
    setError(saved ? undefined : "Save failed")
    setOngoingSaves((os) => os - 1)
  }

  const listRef = useRef<HTMLDivElement>(null)
  useAnimateOrder(listRef)

  // TODO make us get updates through websocket

  return (
    <div
      className="no-page-scroll"
      style={{ display: "flex", width: "100vw", maxWidth: "100%", height: "100%" }}
    >
      <Head>
        <title>{noteMetaId}</title>
      </Head>
      <div
        style={{
          display: "flex",
          flex: "1 0 auto",
          flexDirection: "column",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        {error !== undefined && (
          <div
            style={{
              position: "fixed",
              width: "100%",
              maxWidth: "500px",
              fontSize: "2em",
              textAlign: "center",
              background: "red",
            }}
          >
            {error}
          </div>
        )}
        <div style={{ fontSize: "2em", textAlign: "center", margin: "10px 0" }}>{noteMetaId}</div>
        <div ref={listRef} style={{ flex: "1 0 0", overflowY: "auto" }}>
          {noteState.metaList.map((noteMeta, index) => (
            <NoteMetaRow
              key={noteMeta.id}
              previousNote={noteState.metaList[index - 1]}
              note={noteMeta}
              index={index}
              gainFocusRef={gainFocusRef}
              editNote={editNote}
              deleteNote={deleteNote}
              setSpecificFocus={setSpecificFocus}
              isEditing={editing}
            />
          ))}
        </div>
        <footer style={{ display: "flex", flex: "0 0 auto", marginBottom: "1px" }}>
          {(editing || ongoingSaves > 0) && (
            <>
              <Button
                style={{ flex: "1 0 0", height: "50px" }}
                onClick={() => addNote(noteState.metaList.length)}
                disabled={ongoingSaves > 0}
              >
                Add
              </Button>
              <Button
                style={{ flex: "1 0 0", height: "50px" }}
                onClick={undo}
                disabled={ongoingSaves > 0}
              >
                Undo
              </Button>
            </>
          )}
          {editing || ongoingSaves > 0 ? (
            <Button
              style={{ flex: "1 0 0", height: "50px" }}
              onClick={saveThroughApi}
              disabled={ongoingSaves > 0}
            >
              <span style={{ paddingRight: "5px" }}>Save</span>
              {ongoingSaves > 0 && <LoadIcon style={{ width: "16px" }} />}
              {ongoingSaves === 0 && <Check style={{ width: "16px" }} />}
            </Button>
          ) : (
            <Button style={{ flex: "1 0 0", height: "50px" }} onClick={() => setEditing(true)}>
              <span style={{ paddingRight: "5px" }}>Edit</span>
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}

export default NoteMetaView
