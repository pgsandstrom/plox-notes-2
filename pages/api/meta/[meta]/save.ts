import { NextApiRequest, NextApiResponse } from 'next'
import { saveMeta } from 'server/noteMetaController'
import { Note } from 'types'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const noteid = req.query.meta as string
  const notes = JSON.parse(req.body) as Note[]
  await saveMeta(noteid, notes)
  res.statusCode = 200
  res.json({ status: 'ok' })
}
