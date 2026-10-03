import Link from "next/link"
import type { RefObject } from "react"
import { useEffect, useRef } from "react"
import TextareaAutosize from "react-textarea-autosize"

import type { FocusGain, NoteMeta } from "../types/index.ts"
import Button from "./button.tsx"
import { Cross } from "./icons.tsx"

import styles from "./noteRow.module.css"

interface NoteRowProps {
  previousNote?: NoteMeta
  note: NoteMeta
  index: number
  gainFocusRef: RefObject<FocusGain | undefined>
  editNote: (note: NoteMeta, index: number) => void
  deleteNote: (index: number) => void
  setSpecificFocus: (index: number, char: number) => void
  isEditing: boolean
}

// There is a lot of copied code between the note page and this page.
// Maybe it could be written a bit better to fix DRY.
// But I dont think it is worth the effort.

const NoteMetaRow = ({
  previousNote,
  note,
  index,
  gainFocusRef,
  editNote,
  deleteNote,
  setSpecificFocus,
  isEditing,
}: NoteRowProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  if (!isEditing) {
    // TODO centering all of these more could be nice. Maybe just move this to its own component.
    return (
      <div
        data-animate-id={note.id}
        className={styles.row}
        style={{ marginBottom: "20px", marginLeft: "20px" }}
      >
        <Link href={`/${encodeURIComponent(note.text)}`} className={styles.link}>
          {note.text}
        </Link>
      </div>
    )
  }

  return (
    <div data-animate-id={note.id} className={styles.row}>
      <TextareaAutosize
        className={styles.input}
        data-note-input
        value={note.text}
        onChange={(e) => {
          editNote({ ...note, text: e.target.value }, index)
        }}
        onKeyDown={(e) => {
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
        ref={inputRef}
      />
      <Button onClick={() => deleteNote(index)} style={{ height: "32px", marginTop: "-4px" }}>
        <Cross style={{ marginTop: "8px", width: "16px" }} />
      </Button>
    </div>
  )
}

export default NoteMetaRow
