import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { walletContract, factoryContract } from 'utils/contracts'
import { ETH_CHAINS } from 'utils/config'
import { ethers } from 'ethers'
import { ceramic, family, generateDid, loadDocumentByMetadata } from 'utils/ceramic'
import { MultiSig, MultiSigDeployment } from 'types'

const addressType = z.string().startsWith('0x').length(42)

const paramSchema = z.object({
  address: addressType,
})

const bodySchema = z.object({
  creator: addressType,
  name: z.string(),
  factory: addressType,
  chain: z.number().int(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const params = paramSchema.parse(req.query)
    const body = bodySchema.parse(req.body)

    const factory = ethers.utils.getAddress(body.factory)
    const creator = ethers.utils.getAddress(body.creator)
    const address = ethers.utils.getAddress(params.address)

    if (!ETH_CHAINS.map((c) => c.id).includes(body.chain)) {
      res.status(400).json({ error: 'invalid chain' })
      return
    }

    const chainAddress = await factoryContract(ethers.utils.getAddress(factory), body.chain).computedAddress(body.name, {
      from: creator,
    })
    const name = await walletContract(ethers.utils.getAddress(address), body.chain).name()

    if (chainAddress !== address || name !== body.name) {
      res.status(400).json({ error: 'invalid parameters' })
      return
    }

    const did = await generateDid(process.env.DID_KEY!)
    ceramic.did = did
    const mainDoc = await loadDocumentByMetadata(ceramic.did.id, family, [`wallet:${address}`])
    const chainDoc = await loadDocumentByMetadata(ceramic.did.id, family, [`wallet:${address}`, `chain:${body.chain}`])

    let mainContent: MultiSig
    if (mainDoc.content == null || Object.keys(mainDoc.content).length === 0) {
      mainContent = {
        name: body.name,
        creator,
        factory,
        address,
        deployments: {
          [body.chain]: chainDoc.id.toString(),
        },
      }
      await mainDoc.update(mainContent)
      console.log('created the main doc')
    } else {
      mainContent = mainDoc.content as MultiSig
      if (mainContent.deployments[body.chain] === undefined) {
        mainContent.deployments[body.chain] = chainDoc.id.toString()
        await mainDoc.update(mainContent)
        console.log('updated the main doc')
      }
    }

    if (chainDoc.content == null || Object.keys(chainDoc.content).length === 0) {
      const chainContent: MultiSigDeployment = {
        chain: body.chain,
        address,
        transactions: {},
      }
      await chainDoc.update(chainContent)
      console.log('created the chain doc', chainDoc.id.toString())
    }

    res.status(200).json({ ok: true })
    return
  } else {
    res.status(400).json({ error: 'bad request' })
    return
  }
}
