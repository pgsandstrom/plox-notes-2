import { Note } from 'types'
import TextareaAutosize from 'react-textarea-autosize'
import { useRef, useEffect, forwardRef, MutableRefObject } from 'react'
import Checkbox from './checkbox'
import Button from './button'
import { Cross } from './icons'
import { FocusGain } from 'pages/[note]'

interface NoteRowProps {
  previousNote?: Note
  note: Note
  index: number
  gainFocusRef: MutableRefObject<FocusGain>
  disabled: boolean
  editNote: (note: Note, index: number) => void
  deleteNote: (index: number) => void
  setSpecificFocus: (index: number, char: number) => void
}

const NoteRow = forwardRef<HTMLDivElement, NoteRowProps>(
  (
    {
      note,
      previousNote,
      index,
      gainFocusRef,
      disabled,
      editNote,
      deleteNote,
      setSpecificFocus,
    }: NoteRowProps,
    ref,
  ) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const gainFocus = gainFocusRef.current
    useEffect(() => {
      const inputElement = inputRef.current
      if (gainFocus.index === index && inputElement) {
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
      }
    }, [index, gainFocus])

    // TODO our style here is global to work in TextareaAutosize. styled-jsx would like to solve this by using "resolve"
    // But resolve does not seem to be bundled with nextjs. Find a neat solution.
    return (
      <div key={note.id} ref={ref} className={`note-row ${note.checked && 'checked'}`}>
        <Checkbox
          checked={note.checked}
          onChange={() => {
            editNote({ ...note, checked: !note.checked }, index)
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
  },
)

export default NoteRow
