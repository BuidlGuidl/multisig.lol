import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { ethers } from 'ethers'
import { family, generateDid, generateTag, loadDocumentByMetadata, NO_OP_CREATE_OPTS } from 'utils/ceramic'
import { MultiSigDeployment } from 'types'

const addressType = z.string().startsWith('0x').length(42)

const paramSchema = z.object({
  address: addressType,
  chainId: z.coerce.number().int().min(1),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const params = paramSchema.parse(req.query)
    const address = ethers.utils.getAddress(params.address)
    const did = await generateDid(process.env.DID_KEY!)

    const doc = await loadDocumentByMetadata(
      did.id,
      family,
      [generateTag(address, 'wallet'), generateTag(params.chainId, 'chain')],
      NO_OP_CREATE_OPTS
    )
    console.log(doc.content, doc.id)
    let content: MultiSigDeployment
    if (doc.content == null || Object.keys(doc.content).length === 0) {
      res.status(200).json([])
      return
    } else {
      content = doc.content as MultiSigDeployment
      const transactions = Object.entries(content.transactions).sort((a, b) => a[1].nonce - b[1].nonce)
      res.status(200).json(transactions)
      return
    }
  } else {
    res.status(400).json({ error: 'bad request' })
    return
  }
}
