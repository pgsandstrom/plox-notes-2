import type { RefObject } from "react"
import { memo, useEffect, useRef } from "react"
import TextareaAutosize from "react-textarea-autosize"

import type { FocusGain, Note } from "../types/index.ts"
import Button from "./button.tsx"
import Checkbox from "./checkbox.tsx"
import { Cross } from "./icons.tsx"

import styles from "./noteRow.module.css"

const SWIPE_INDENTATION_LIMIT = 30
const SWIPE_MAX_Y_DIFF = 25

interface NoteRowProps {
  previousNote?: Note
  note: Note
  index: number
  gainFocusRef: RefObject<FocusGain | undefined>
  disabled: boolean
  checkNote: (checked: boolean, index: number) => void
  editNote: (note: Note, index: number) => void
  deleteNote: (index: number) => void
  setSpecificFocus: (index: number, char: number) => void
  setIndentation: (index: number, indentation: number) => void
}

const NoteRow = ({
  note,
  previousNote,
  index,
  gainFocusRef,
  disabled,
  checkNote,
  editNote,
  deleteNote,
  setSpecificFocus,
  setIndentation,
}: NoteRowProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const startTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Currently when deleting a row with keyboard presses on mobile the keyboard flickers.
  // I have tried moving focus gaining to before deleting rows, but it results in weird bugs on mobile.
  // Since debugging stuff like that is super frustrating on mobile, I have given up on fixing this.
  // runs after every render, since the parent sets gainFocusRef right before the render that should take focus
  useEffect(() => {
    const gainFocus = gainFocusRef.current
    const inputElement = inputRef.current
    if (gainFocus?.index === index && inputElement) {
      const inputLength = inputElement.value.length
      const selectionPosition: number =
        gainFocus.position === "end"
          ? inputLength
          : gainFocus.position === "start"
            ? 0
            : gainFocus.position
      inputElement.selectionStart = selectionPosition
      inputElement.selectionEnd = selectionPosition
      inputElement.focus()
      gainFocusRef.current = undefined
    }
  })

  const increaseIndentation = () => {
    if (note.indentation < 3) {
      setIndentation(index, note.indentation + 1)
    }
  }

  const decreaseIndentation = () => {
    if (note.indentation > 0) {
      setIndentation(index, note.indentation - 1)
    }
  }

  return (
    <div
      data-animate-id={note.id}
      className={note.checked ? `${styles.row} ${styles.checked}` : styles.row}
      style={{
        marginLeft: note.indentation * 15,
      }}
    >
      <Checkbox
        checked={note.checked}
        onChange={() => {
          checkNote(!note.checked, index)
        }}
      />
      <TextareaAutosize
        className={styles.input}
        data-note-input
        value={note.text}
        onChange={(e) => {
          editNote({ ...note, text: e.target.value }, index)
        }}
        onKeyDown={(e) => {
          if (e.altKey && (e.key === "ArrowLeft" || e.key === "h")) {
            e.preventDefault()
            decreaseIndentation()
            return
          }
          if (e.altKey && (e.key === "ArrowRight" || e.key === "l")) {
            e.preventDefault()
            increaseIndentation()
            return
          }
          const inputElement = inputRef.current
          if (
            e.key === "Backspace" &&
            inputElement?.selectionStart === 0 &&
            inputElement.selectionEnd === 0
          ) {
            e.preventDefault()
            deleteNote(index)
            if (previousNote) {
              editNote(
                {
                  ...previousNote,
                  text: `${previousNote.text}${note.text}`,
                },
                index - 1,
              )
              setSpecificFocus(index - 1, previousNote.text.length)
            }
          }
        }}
        onTouchStart={(e) => {
          if (e.changedTouches.length === 0) {
            return
          }
          startTouchRef.current = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
          }
        }}
        onTouchEnd={(e) => {
          if (e.changedTouches.length === 0) {
            return
          }
          const startX = startTouchRef.current.x
          const startY = startTouchRef.current.y
          const endX = e.changedTouches[0].clientX
          const endY = e.changedTouches[0].clientY

          if (Math.abs(endY - startY) > SWIPE_MAX_Y_DIFF) {
            return
          }

          if (endX - startX > SWIPE_INDENTATION_LIMIT) {
            increaseIndentation()
          } else if (endX - startX < -SWIPE_INDENTATION_LIMIT) {
            decreaseIndentation()
          }
        }}
        disabled={disabled}
        ref={inputRef}
      />
      <Button
        onClick={() => deleteNote(index)}
        style={{ height: "32px", marginTop: "-4px" }}
        disabled={disabled}
      >
        <Cross style={{ marginTop: "8px", width: "16px" }} />
      </Button>
    </div>
  )
}

const isPropsEqual = (prev: NoteRowProps, next: NoteRowProps) => {
  return (
    prev.disabled === next.disabled &&
    prev.index === next.index &&
    prev.note.text === next.note.text &&
    prev.note.checked === next.note.checked &&
    prev.note.indentation === next.note.indentation &&
    prev.previousNote?.text === next.previousNote?.text &&
    prev.previousNote?.checked === next.previousNote?.checked &&
    prev.previousNote?.indentation === next.previousNote?.indentation
  )
}

export default memo(NoteRow, isPropsEqual)
