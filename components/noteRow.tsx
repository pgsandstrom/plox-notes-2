import { Note } from "types";
import { useRef, useEffect } from "react";
import Checkbox from "./checkbox";
import Button from "./button";
import { Cross } from "./icons";

interface NoteRowProps {
  note: Note;
  index: number;
  focus: boolean;
  hasFocused: () => void;
  disabled: boolean;
  editNote: (note: Note, index: number) => void;
  addNote: (index: number) => void;
  deleteNote: (index: number) => void;
}

const NoteRow = ({
  note,
  index,
  focus,
  hasFocused,
  disabled,
  editNote,
  addNote,
  deleteNote,
}: NoteRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const inputElement = inputRef.current;
    if (focus && inputElement) {
      const inputLength = inputElement.value.length;
      inputElement.selectionStart = inputLength;
      inputElement.selectionEnd = inputLength;
      inputElement.focus();
      hasFocused();
    }
  }, [focus]);

  return (
    <div key={note.id} className={`note-row ${note.checked && "checked"}`}>
      <Checkbox
        checked={note.checked}
        onChange={() => {
          editNote({ ...note, checked: !note.checked }, index);
        }}
      />
      <input
        value={note.text}
        onChange={(e) => editNote({ ...note, text: e.target.value }, index)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addNote(index + 1);
          }
        }}
        onKeyDown={(e) => {
          if (e.keyCode === 8 && note.text === "") {
            // backspace
            e.preventDefault();
            deleteNote(index);
          }
        }}
        disabled={disabled}
        ref={inputRef}
      />
      <Button>
        <Cross style={{ marginTop: "8px" }} />
      </Button>
      <style jsx>{`
        .note-row {
          display: flex;
          margin: 6px 0;
        }

        input {
          border: none;
          border-bottom: 1px solid gray;
          flex: 1 0 0;
          font-size: 1.2em;
          height: 28px;
          margin-top: 4px;
          margin-left: 10px;
          outline: none;
        }

        input:focus {
          border-bottom: 1px solid #009fd1;
        }

        .checked {
          color: #bebfbf;
        }

        .checked input {
          color: #bebfbf;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
};

export default NoteRow;