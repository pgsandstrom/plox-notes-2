import { NoteMeta } from 'types'
import Link from 'next/link'
import TextareaAutosize from 'react-textarea-autosize'
import { MutableRefObject, forwardRef, useEffect, useRef } from 'react'
import Button from './button'
import { Cross } from './icons'
import { FocusGain } from 'pages/[note]'

interface NoteRowProps {
  previousNote?: NoteMeta
  note: NoteMeta
  index: number
  gainFocusRef: MutableRefObject<FocusGain | undefined>
  disabled: boolean
  editNote: (note: NoteMeta, index: number) => void
  deleteNote: (index: number) => void
  setSpecificFocus: (index: number, char: number) => void
  isEditing: boolean
}

// There is a lot of copied code between the note page and this page.
// Maybe it could be written a bit better to fix DRY.
// But I dont think it is worth the effort.

const NoteMetaRow = forwardRef<HTMLDivElement, NoteRowProps>(
  (
    {
      previousNote,
      note,
      index,
      gainFocusRef,
      disabled,
      editNote,
      deleteNote,
      setSpecificFocus,
      isEditing,
    }: NoteRowProps,
    ref,
  ) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)

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

    if (!isEditing) {
      // TODO centering all of these more could be nice. Maybe just move this to its own component.
      return (
        <>
          <div className="note-row" style={{ marginBottom: '20px', marginLeft: '20px' }}>
            <Link href={`/${note.text}`}>{note.text}</Link>
          </div>
          {getStyle()}
        </>
      )
    }

    // TODO our style here is global to work in TextareaAutosize. styled-jsx would like to solve this by using "resolve"
    // But resolve does not seem to be bundled with nextjs. Find a neat solution.
    return (
      <div key={note.id} ref={ref} className="note-row">
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
        {getStyle()}
      </div>
    )
  },
)

const getStyle = () => (
  <style jsx global>{`
    .note-row {
      display: flex;
      align-items: center;
      margin: 6px 0;
    }

    a {
      font-size: 1.2em;
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
)

export default NoteMetaRow
