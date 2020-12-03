import { Note } from 'types'
import TextareaAutosize from 'react-textarea-autosize'
import { useRef, useEffect, forwardRef } from 'react'
import Checkbox from './checkbox'
import Button from './button'
import { Cross } from './icons'

interface NoteRowProps {
  note: Note
  index: number
  focus: boolean
  hasFocused: () => void
  disabled: boolean
  editNote: (note: Note, index: number) => void
  addNote: (index: number) => void
  deleteNote: (index: number) => void
}

const NoteRow = forwardRef<HTMLDivElement, NoteRowProps>(
  (
    { note, index, focus, hasFocused, disabled, editNote, addNote, deleteNote }: NoteRowProps,
    ref,
  ) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      const inputElement = inputRef.current
      if (focus && inputElement) {
        const inputLength = inputElement.value.length
        inputElement.selectionStart = inputLength
        inputElement.selectionEnd = inputLength
        inputElement.focus()
        hasFocused()
      }
    }, [focus, hasFocused])

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
            // if (e.key === 'Enter') {
            //   e.preventDefault()
            //   addNote(index + 1)
            // } else
            if (e.key === 'Backspace' && note.text === '') {
              e.preventDefault()
              deleteNote(index)
            }
          }}
          onKeyUp={(_e) => {
            // this is a backup since onKeyDown is buggy on mobile. For example see https://bugs.chromium.org/p/chromium/issues/detail?id=118639
            // TODO detect when newline is somewhere else and split accordingly.
            if (note.text.endsWith('\n')) {
              editNote({ ...note, text: note.text.substring(0, note.text.length - 1) }, index)
              addNote(index + 1)
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
