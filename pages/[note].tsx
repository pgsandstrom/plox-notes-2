import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import Checkbox from "components/checkbox";
import { Note } from "types";
import { useState } from "react";
import useWebsocket from "hooks/useWebsocket";

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

//TODO test url like /Per/Och/Maria/Handlar

const NoteView = (props: NoteProps) => {
  const router = useRouter();
  const noteId = router.query.note as string;

  const [error, setError] = useState<string>();
  const [notes, setNotes] = useState<Note[]>(props.notes);

  useWebsocket(noteId, setError, setNotes);

  return (
    <>
      <h1>Note: {noteId}</h1>
      {notes.map((note) => (
        <div key={note.id}>
          <Checkbox checked={note.checked} />
          <span>{note.text}</span>
        </div>
      ))}
    </>
  );
};

export default NoteView;
