import { Note } from 'types'
import TextareaAutosize from 'react-textarea-autosize'
import { useRef, useEffect, MutableRefObject } from 'react'
import Checkbox from './checkbox'
import Button from './button'
import { Cross } from './icons'
import { FocusGain } from 'pages/[note]'
import useKey from 'hooks/useKey'
import useAnimateOrder from 'hooks/useAnimateOrder'
import React from 'react'

const SWIPE_INDENTATION_LIMIT = 30
const SWIPE_MAX_Y_DIFF = 25

interface NoteRowProps {
  previousNote?: Note
  note: Note
  index: number
  gainFocusRef: MutableRefObject<FocusGain | undefined>
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
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const startTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Currently when deleting a row with keyboard presses on mobile the keyboard flickers.
  // I have tried moving focus gaining to before deleting rows, but it results in weird bugs on mobile.
  // Since debugging stuff like that is super frustrating on mobile, I have given up on fixing this.
  const gainFocus = gainFocusRef.current
  useEffect(() => {
    const inputElement = inputRef.current
    if (gainFocus?.index === index && inputElement) {
      const inputLength = inputElement.value.length
      const selectionPosition: number =
        gainFocus.position === 'end'
          ? inputLength
          : gainFocus.position === 'start'
          ? 0
          : gainFocus.position
      inputElement.selectionStart = selectionPosition
      inputElement.selectionEnd = selectionPosition
      inputElement.focus()
      gainFocusRef.current = undefined
    }
  }, [index, gainFocus, gainFocusRef])

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

  // TODO it would be nicer to have one root useKey instead of one per row like this, but it would require some hax
  useKey(
    (key) => {
      if (document.activeElement !== inputRef.current) {
        return
      }
      if (key === 'h' || key === 'ArrowLeft') {
        decreaseIndentation()
      } else {
        increaseIndentation()
      }
    },
    ['ArrowRight', 'h', 'ArrowLeft', 'l'],
    'keydown',
    false,
    {
      alt: true,
    },
  )

  useAnimateOrder(index, ref)

  // TODO our style here is global to work in TextareaAutosize. styled-jsx would like to solve this by using "resolve"
  // But resolve does not seem to be bundled with nextjs. Find a neat solution.
  return (
    <div
      key={note.id}
      ref={ref}
      className={`note-row ${note.checked && 'checked'}`}
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
        className="note-row-input"
        value={note.text}
        onChange={(e) => {
          editNote({ ...note, text: e.target.value }, index)
        }}
        onKeyDown={(e) => {
          const inputElement = inputRef.current
          if (
            e.key === 'Backspace' &&
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
      <Button onClick={() => deleteNote(index)} style={{ height: '32px', marginTop: '-4px' }}>
        <Cross style={{ marginTop: '8px', width: '16px' }} />
      </Button>
      <style jsx global>{`
        .note-row {
          display: flex;
          align-items: center;
          margin: 6px 0;
          transition: margin 100ms ease-in-out;
        }

        .note-row-input {
          border: none;
          border-bottom: 1px solid gray;
          flex: 1 0 0;
          font-size: 1.2em;
          height: 28px;
          margin-left: 10px;
          line-height: 28px;
          outline: none;
          resize: none;
        }

        .note-row-input:focus {
          border-bottom: 1px solid #009fd1;
        }

        .checked {
          color: #bebfbf;
        }

        .checked .note-row-input {
          color: #bebfbf;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  )
}

const isPropsEqual = (prev: NoteRowProps, next: NoteRowProps) => {
  return (
    prev.note.text === next.note.text &&
    prev.note.checked === next.note.checked &&
    prev.note.indentation === next.note.indentation &&
    prev.previousNote?.text === next.previousNote?.text &&
    prev.previousNote?.checked === next.previousNote?.checked &&
    prev.previousNote?.indentation === next.previousNote?.indentation
  )
}

export default React.memo(NoteRow, isPropsEqual)
