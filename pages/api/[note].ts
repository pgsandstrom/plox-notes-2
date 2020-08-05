// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { querySingle, SQL } from "../../backend/util/db";

export default async (req, res) => {
  const noteid = req.query.note;
  const queryResult = await querySingle(
    SQL`SELECT data FROM note WHERE id = ${noteid}`
  );
  res.statusCode = 200;
  res.json(queryResult.data);
};
