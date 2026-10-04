import type { GetServerSideProps } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import Button from "../components/button.tsx"
import { Check, Cross, LoadIcon } from "../components/icons.tsx"
import NoteRow from "../components/noteRow.tsx"
import useAnimateOrder from "../hooks/useAnimateOrder.ts"
import useWebsocket from "../hooks/useWebsocket.ts"
import { loadOrShowNewNote } from "../server/noteController.ts"
import { WEBSOCKET_COMMAND } from "../server/websocketConstants.ts"
import type { FocusGain, Note, NotePost } from "../types/index.ts"

interface NoteProps {
  notes: Note[]
}

export const getServerSideProps: GetServerSideProps<NoteProps> = async (context) => {
  const notes = await loadOrShowNewNote(context.params!.note as string)
  return { props: { notes } }
}

const createNewNote = (checked: boolean, text: string, indentation: number): Note => {
  return {
    id: uuidv4(),
    text,
    checked,
    indentation,
  }
}

interface NoteState {
  notes: Note[]
  history: Note[][]
  lastUserAction: number
}

interface SetNoteAction {
  type: "SET_NOTE_ACTION"
  notes: Note[]
}

interface AddNoteAction {
  type: "ADD_NOTE_ACTION"
  index: number
  text: string
  checked?: boolean
  indentation: number
}

interface DeleteNoteAction {
  type: "DELETE_NOTE_ACTION"
  index: number
}

interface EditNoteAction {
  type: "EDIT_NOTE_ACTION"
  note: Note
  index: number
}

interface CheckNoteAction {
  type: "CHECK_NOTE_ACTION"
  checked: boolean
  index: number
}

interface UndoAction {
  type: "UNDO_ACTION"
}

interface SetIndentationAction {
  type: "INDENTATION_ACTION"
  indentation: number
  index: number
}

type NoteAction =
  | SetNoteAction
  | AddNoteAction
  | DeleteNoteAction
  | EditNoteAction
  | CheckNoteAction
  | UndoAction
  | SetIndentationAction

const isNotesIdentical = (notes1: Note[], notes2: Note[]) => {
  if (notes1.length !== notes2.length) {
    return false
  }
  return notes1.every((note, index) => {
    const otherNote = notes2[index]
    return (
      note.checked === otherNote.checked &&
      note.text === otherNote.text &&
      note.indentation === otherNote.indentation
    )
  })
}

const MAX_HISTORY = 100

const pushHistory = (state: NoteState) => [state.notes, ...state.history.slice(0, MAX_HISTORY - 1)]

const noteReducer = (state: NoteState, action: NoteAction): NoteState => {
  if (action.type === "SET_NOTE_ACTION") {
    return {
      notes: action.notes,
      history: isNotesIdentical(state.notes, action.notes) ? state.history : pushHistory(state),
      lastUserAction: state.lastUserAction,
    }
  } else if (action.type === "ADD_NOTE_ACTION") {
    const checked = action.checked ?? false
    return {
      notes: [
        ...state.notes.slice(0, action.index),
        createNewNote(checked, action.text, action.indentation),
        ...state.notes.slice(action.index, state.notes.length),
      ],
      history: pushHistory(state),
      lastUserAction: new Date().getTime(),
    }
  } else if (action.type === "DELETE_NOTE_ACTION") {
    return {
      notes: [
        ...state.notes.slice(0, action.index),
        ...state.notes.slice(action.index + 1, state.notes.length),
      ],
      history: pushHistory(state),
      lastUserAction: new Date().getTime(),
    }
  } else if (action.type === "EDIT_NOTE_ACTION") {
    // a newline (enter or a multi-line paste) splits the row, every extra line becomes a new row
    const [firstLine, ...newLines] = action.note.text.split(/\r?\n/)
    const editedNote = { ...action.note, text: firstLine }

    const isLastCheckedNote =
      state.notes.length - 1 === action.index || !state.notes[action.index + 1].checked
    const newNotes = newLines.map((text) =>
      createNewNote(isLastCheckedNote ? false : editedNote.checked, text, editedNote.indentation),
    )

    return {
      notes: [
        ...state.notes.slice(0, action.index),
        editedNote,
        ...newNotes,
        ...state.notes.slice(action.index + 1),
      ],
      history: pushHistory(state),
      lastUserAction: new Date().getTime(),
    }
  } else if (action.type === "CHECK_NOTE_ACTION") {
    const currentIndentation = state.notes[action.index].indentation
    let finalIndex: number | undefined = undefined
    if (action.checked) {
      let currentIndex = action.index - 1
      let candidateIndex: number | undefined = action.index
      while (finalIndex === undefined) {
        if (currentIndex === -1) {
          finalIndex = 0
        } else if (state.notes[currentIndex].indentation < currentIndentation) {
          finalIndex = candidateIndex
        } else if (
          state.notes[currentIndex].indentation === currentIndentation &&
          state.notes[currentIndex].checked
        ) {
          finalIndex = candidateIndex
        } else if (state.notes[currentIndex].indentation === currentIndentation) {
          candidateIndex = currentIndex
        }
        currentIndex -= 1
      }
    } else {
      let currentIndex = action.index + 1
      let candidateIndex: number | undefined = action.index
      while (finalIndex === undefined) {
        if (currentIndex === state.notes.length) {
          finalIndex = state.notes.length - 1
        } else if (state.notes[currentIndex].indentation < currentIndentation) {
          finalIndex = candidateIndex
        } else if (
          state.notes[currentIndex].indentation === currentIndentation &&
          !state.notes[currentIndex].checked
        ) {
          finalIndex = candidateIndex
        } else if (state.notes[currentIndex].indentation >= currentIndentation) {
          candidateIndex = currentIndex
        }
        currentIndex += 1
      }
    }

    let noteMoveCount = state.notes
      .slice(action.index + 1)
      .findIndex((note) => note.indentation <= currentIndentation)

    if (noteMoveCount >= 0) {
      noteMoveCount += 1
    } else if (noteMoveCount === -1) {
      noteMoveCount = state.notes.length - action.index
    }

    // if we move down, we have to discount the "sub notes" since they move with us
    if (finalIndex > action.index) {
      finalIndex = finalIndex - (noteMoveCount - 1)
    }

    const newNotes = [...state.notes]
    const movedNotes = newNotes.splice(action.index, noteMoveCount)
    newNotes.splice(finalIndex, 0, ...movedNotes)

    newNotes[finalIndex] = {
      ...newNotes[finalIndex],
      checked: action.checked,
    }

    return {
      notes: newNotes,
      history: pushHistory(state),
      lastUserAction: new Date().getTime(),
    }
  } else if (action.type === "UNDO_ACTION") {
    if (state.history.length === 0) {
      return state
    }
    return {
      notes: state.history[0],
      history: state.history.slice(1),
      lastUserAction: new Date().getTime(),
    }
    // oxlint-disable-next-line typescript/no-unnecessary-condition
  } else if (action.type === "INDENTATION_ACTION") {
    return {
      notes: state.notes.map((note, index) => {
        return index === action.index ? { ...note, indentation: action.indentation } : note
      }),
      history: pushHistory(state),
      lastUserAction: new Date().getTime(),
    }
  } else {
    return state
  }
}

const NoteView = (props: NoteProps) => {
  const router = useRouter()
  const noteId = router.query.note as string

  const [ongoingSaves, setOngoingSaves] = useState(0)
  const [saveFailed, setSaveFailed] = useState(false)

  const [error, setError] = useState<string>()
  const gainFocusRef = useRef<FocusGain | undefined>({
    index: props.notes.length - 1,
    position: "end",
  })

  // TODO two set note actions happen on first load
  const [noteState, dispatch] = useReducer(noteReducer, {
    notes: props.notes,
    history: [],
    lastUserAction: 0,
  })

  const setNotes = useCallback(
    (notes: Note[]) => {
      dispatch({
        type: "SET_NOTE_ACTION",
        notes,
      })
    },
    [dispatch],
  )

  const addNote = useCallback(
    (index: number, text: string, checked: boolean, indentation: number) => {
      dispatch({
        type: "ADD_NOTE_ACTION",
        index,
        text,
        checked,
        indentation,
      })
      gainFocusRef.current = {
        index,
        position: "start",
      }
    },
    [dispatch],
  )

  const deleteNote = useCallback(
    (index: number) => {
      dispatch({
        type: "DELETE_NOTE_ACTION",
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
    },
    [dispatch],
  )

  const checkNote = useCallback(
    (checked: boolean, index: number) => {
      dispatch({
        type: "CHECK_NOTE_ACTION",
        checked,
        index,
      })
    },
    [dispatch],
  )

  const editNote = useCallback(
    (note: Note, index: number) => {
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
        type: "EDIT_NOTE_ACTION",
        note,
        index,
      })
    },
    [dispatch],
  )

  const setSpecificFocus = useCallback((index: number, char: number) => {
    gainFocusRef.current = {
      index: index,
      position: char,
    }
  }, [])

  const undo = useCallback(() => {
    dispatch({
      type: "UNDO_ACTION",
    })
  }, [dispatch])

  const setIndentation = useCallback(
    (index: number, indentation: number) => {
      dispatch({
        type: "INDENTATION_ACTION",
        index,
        indentation,
      })
    },
    [dispatch],
  )

  const saveThroughApi = async () => {
    setOngoingSaves((os) => os + 1)
    setSaveFailed(false)
    // shown on the button only, setError would disable the whole page until the websocket reconnects
    const saved = await fetch(`/api/note/${noteId}/save`, {
      method: "POST",
      body: JSON.stringify(noteState.notes),
    }).then(
      (result) => result.ok,
      () => false,
    )
    setSaveFailed(!saved)
    setOngoingSaves((os) => os - 1)
  }

  const onConnect = () => {
    setError(undefined)
    setOngoingSaves(0)
  }

  const websocketEmit = useWebsocket(noteId, setError, setNotes, onConnect)

  // only save on user actions, not when notes arrive from the server
  const savedUserActionRef = useRef(0)
  useEffect(() => {
    if (noteState.lastUserAction > 0 && noteState.lastUserAction !== savedUserActionRef.current) {
      savedUserActionRef.current = noteState.lastUserAction
      const notePost: NotePost = { id: noteId, notes: noteState.notes }
      websocketEmit(WEBSOCKET_COMMAND.POST, notePost)
    }
  }, [noteState.lastUserAction, noteId, noteState.notes, websocketEmit])

  const listRef = useRef<HTMLDivElement>(null)
  useAnimateOrder(listRef)

  return (
    <div
      className="no-page-scroll"
      style={{ display: "flex", width: "100vw", maxWidth: "100%", height: "100%" }}
    >
      <Head>
        <title>{noteId}</title>
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
        <div style={{ fontSize: "2em", textAlign: "center", margin: "10px 0" }}>{noteId}</div>
        <div ref={listRef} style={{ flex: "1 0 0", overflowY: "auto" }}>
          {noteState.notes.map((note, index) => (
            <NoteRow
              key={note.id}
              previousNote={noteState.notes[index - 1]}
              note={note}
              index={index}
              gainFocusRef={gainFocusRef}
              disabled={error !== undefined}
              checkNote={checkNote}
              editNote={editNote}
              deleteNote={deleteNote}
              setSpecificFocus={setSpecificFocus}
              setIndentation={setIndentation}
            />
          ))}
        </div>
        <footer style={{ display: "flex", flex: "0 0 auto", marginBottom: "1px" }}>
          <Button
            style={{ flex: "1 0 0", height: "50px" }}
            onClick={() => {
              const indentation = noteState.notes[noteState.notes.length - 1]?.indentation ?? 0
              addNote(noteState.notes.length, "", false, indentation)
            }}
            disabled={error !== undefined}
          >
            Add
          </Button>
          <Button
            style={{ flex: "1 0 0", height: "50px" }}
            onClick={undo}
            disabled={noteState.history.length === 0 || error !== undefined}
          >
            Undo
          </Button>
          <Button
            style={{
              flex: "1 0 0",
              height: "50px",
              ...(saveFailed && { background: "#ff9b9b", borderColor: "#d10000" }),
            }}
            onClick={saveThroughApi}
            disabled={error !== undefined}
          >
            <span style={{ paddingRight: "5px" }}>Save</span>
            {ongoingSaves > 0 && <LoadIcon style={{ width: "16px" }} />}
            {ongoingSaves === 0 && !saveFailed && <Check style={{ width: "16px" }} />}
            {ongoingSaves === 0 && saveFailed && <Cross style={{ width: "12px" }} />}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default NoteView
