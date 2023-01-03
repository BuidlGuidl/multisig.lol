import type { NextApiRequest, NextApiResponse } from 'next'
import { generateDid } from 'utils/ceramic'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.DID_KEY) {
    const did = await generateDid(process.env.DID_KEY)
    res.status(200).json(did.id)
    return
  } else {
    res.status(500).json({ error: 'no controller available' })
    return
  }
}
