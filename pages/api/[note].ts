import { NextApiRequest, NextApiResponse } from "next";
import { load } from "server/noteController";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const noteid = req.query.note as string;
  const notes = await load(noteid);
  res.statusCode = 200;
  res.json(notes.data);
};
