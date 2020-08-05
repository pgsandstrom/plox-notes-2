import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import Checkbox from "../components/checkbox";

interface Note {
  id: string;
  text: string;
  checked: boolean;
}

interface NoteProps {
  data: Note[];
}

export const getServerSideProps: GetServerSideProps<NoteProps> = async (
  context
) => {
  // console.log(`hej:${context.params.note}`);
  const res = await fetch(`http://localhost:3000/api/${context.params.note}`);
  const data = await res.json();
  return { props: { data } };
};

const Comment = (props: NoteProps) => {
  const router = useRouter();
  const { note } = router.query;
  console.log(JSON.stringify(props));

  return (
    <>
      <h1>Note: {note}</h1>
      {props.data.map((note) => (
        <div key={note.id}>
          <Checkbox checked={note.checked} />
          <span>{note.text}</span>
        </div>
      ))}
    </>
  );
};

export default Comment;
