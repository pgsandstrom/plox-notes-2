import { NextApiRequest, NextApiResponse } from 'next'
import { loadOrShowNewNote } from 'server/noteController'

// This currently isn't used. We only retrieve data through SSR or websocket.
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const noteid = req.query.note as string
  const notes = await loadOrShowNewNote(noteid)
  res.statusCode = 200
  res.json(notes)
}
