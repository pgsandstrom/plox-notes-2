import Head from "next/head";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { Note } from "types";
import { useState, useRef, useReducer } from "react";
import useWebsocket from "hooks/useWebsocket";
import NoteRow from "components/noteRow";

interface NoteProps {
  notes: Note[];
}

export const getServerSideProps: GetServerSideProps<NoteProps> = async (
  context
) => {
  const res = await fetch(`http://localhost:3000/api/${context.params!.note}`);
  const data = await res.json();
  return { props: { notes: data } };
};

const newNote = (): Note => {
  return {
    id: uuidv4(),
    text: "",
    checked: false,
  };
};

//TODO test url like /Per/Och/Maria/Handlar

interface NoteState {
  notes: Note[];
  history: Note[][];
}

interface SetNoteAction {
  type: "SET_NOTE_ACTION";
  notes: Note[];
}

interface AddNoteAction {
  type: "ADD_NOTE_ACTION";
  index: number;
}

interface DeleteNoteAction {
  type: "DELETE_NOTE_ACTION";
  index: number;
}

interface EditNoteAction {
  type: "EDIT_NOTE_ACTION";
  note: Note;
  index: number;
}

type NoteAction =
  | SetNoteAction
  | AddNoteAction
  | DeleteNoteAction
  | EditNoteAction;

const NoteView = (props: NoteProps) => {
  const router = useRouter();
  const noteId = router.query.note as string;

  const [error, setError] = useState<string>();
  const [focusIndex, setFocusIndex] = useState<number>(props.notes.length - 1);
  const gainFocusRef = useRef<boolean>(true);

  const isNotesEmpty = (notes: Note[]): boolean => {
    return notes.length === 1 && notes[0].text === "";
  };

  const [noteState, dispatch] = useReducer(
    (state: NoteState, action: NoteAction) => {
      if (action.type === "SET_NOTE_ACTION") {
        return {
          notes: action.notes,
          history: isNotesEmpty(state.notes)
            ? [...state.history]
            : [state.notes, ...state.history],
        };
      } else if (action.type === "ADD_NOTE_ACTION") {
        return {
          notes: [
            ...state.notes.slice(0, action.index),
            newNote(),
            ...state.notes.slice(action.index, state.notes.length),
          ],
          history: [state.notes, ...state.history],
        };
      } else if (action.type === "DELETE_NOTE_ACTION") {
        return {
          notes: [
            ...state.notes.slice(0, action.index),
            ...state.notes.slice(action.index + 1, state.notes.length),
          ],
          history: [state.notes, ...state.history],
        };
      } else if (action.type === "EDIT_NOTE_ACTION") {
        return {
          notes: state.notes.map((note, index) =>
            index === action.index ? action.note : note
          ),
          history: [state.notes, ...state.history],
        };
      } else {
        return state;
      }
    },
    {
      notes: props.notes,
      history: [],
    }
  );

  const setNotes = (notes: Note[]) => {
    dispatch({
      type: "SET_NOTE_ACTION",
      notes,
    });
  };

  const addNote = (index: number) => {
    dispatch({
      type: "ADD_NOTE_ACTION",
      index,
    });
    setFocusIndex(index);
    gainFocusRef.current = true;
  };

  const deleteNote = (index: number) => {
    dispatch({
      type: "DELETE_NOTE_ACTION",
      index,
    });
    if (index > 0) {
      setFocusIndex(index - 1);
      gainFocusRef.current = true;
    }
  };

  const editNote = (note: Note, index: number) => {
    dispatch({
      type: "EDIT_NOTE_ACTION",
      note,
      index,
    });
  };

  const hasFocused = () => (gainFocusRef.current = false);

  useWebsocket(noteId, setError, setNotes);

  return (
    <div style={{ display: "flex" }}>
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
        <h1>{noteId}</h1>
        {noteState.notes.map((note, index) => (
          <NoteRow
            key={note.id}
            note={note}
            index={index}
            focus={index === focusIndex && gainFocusRef.current === true}
            hasFocused={hasFocused}
            disabled={error !== undefined}
            editNote={editNote}
            addNote={addNote}
            deleteNote={deleteNote}
          />
        ))}
      </div>
    </div>
  );
};

export default NoteView;
