import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { ethers } from 'ethers'
import { family, generateDid, generateTag, loadDocumentByMetadata, NO_OP_CREATE_OPTS } from 'utils/ceramic'
import { MultiSig } from 'types'

const addressType = z.string().startsWith('0x').length(42)

const paramSchema = z.object({
  address: addressType,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const params = paramSchema.parse(req.query)
    const address = ethers.utils.getAddress(params.address)
    const did = await generateDid(process.env.DID_KEY!)
    const doc = await loadDocumentByMetadata(did.id, family, [generateTag(address, 'wallet')], NO_OP_CREATE_OPTS)
    let chainContent: MultiSig
    if (doc.content == null || Object.keys(doc.content).length === 0) {
      res.status(200).json({ deployments: [] })
      return
    } else {
      chainContent = doc.content as MultiSig
      res.status(200).json({ deployments: Object.keys(chainContent.deployments), creator: chainContent.creator, factory: chainContent.factory })
      return
    }
  } else {
    res.status(400).json({ error: 'bad request' })
    return
  }
}
