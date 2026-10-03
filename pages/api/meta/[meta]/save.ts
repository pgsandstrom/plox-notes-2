import type { NextApiRequest, NextApiResponse } from "next"

import { saveMeta } from "../../../../server/noteMetaController.ts"
import type { Note } from "../../../../types/index.ts"

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const noteid = req.query.meta as string
  const notes = JSON.parse(req.body as string) as Note[]
  await saveMeta(noteid, notes)
  res.statusCode = 200
  res.json({ status: "ok" })
}
