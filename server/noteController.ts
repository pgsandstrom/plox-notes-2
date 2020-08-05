import { querySingle, SQL, queryString } from "./util/db";
import { Note } from "types";
import { v4 as uuidv4 } from "uuid";

export const load = async (id: string) => {
  const queryResult = await querySingle<{ data: Note[] }>(
    SQL`SELECT data FROM note WHERE id = ${id}`
  );
  if (queryResult) {
    console.log(`is note: ${JSON.stringify(queryResult)}`);
    return queryResult;
  } else {
    return {
      data: [
        {
          id: uuidv4(),
          text: "",
          checked: false,
        },
      ],
    };
  }
};

export const save = async (id: string, notes: Note[]) => {
  const queryResult = await querySingle<Note[]>(
    SQL`SELECT data FROM note WHERE id = ${id}`
  );
  if (queryResult) {
    return queryString(`UPDATE note SET data=${notes}::jsonb WHERE id = ${id}`);
  } else {
    return queryString(`INSERT INTO note(id, data) VALUES(${id}, ${notes})`);
  }
};
