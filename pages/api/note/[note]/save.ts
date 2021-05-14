import { NextApiRequest, NextApiResponse } from 'next'
import { saveNote } from 'server/noteController'
import { Note } from 'types'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const noteid = req.query.note as string
  const notes = JSON.parse(req.body) as Note[]
  await saveNote(noteid, notes)
  res.statusCode = 200
  res.json({ status: 'ok' })
}
