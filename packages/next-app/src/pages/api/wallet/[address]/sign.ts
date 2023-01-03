import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { walletContract } from 'utils/contracts'
import { ETH_CHAINS } from 'utils/config'
import { ethers } from 'ethers'
import { ceramic, family, generateDid, loadDocumentByMetadata } from 'utils/ceramic'
import { MultiSigDeployment } from 'types'
import { Address } from 'wagmi'

const addressType = z.string().startsWith('0x').length(42)

const paramSchema = z.object({
  address: addressType,
})

const bodySchema = z.object({
  hash: z.string(),
  nonce: z.number().int(),
  to: addressType,
  data: z.string(),
  value: z.string(),
  chain: z.number().int(),
  signature: z.string(),
  signer: addressType,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const params = paramSchema.parse(req.query)
    const body = bodySchema.parse(req.body)
    const address = ethers.utils.getAddress(params.address)
    const signer = ethers.utils.getAddress(body.signer)
    const to = ethers.utils.getAddress(body.to)

    if (!ETH_CHAINS.map((c) => c.id).includes(body.chain)) {
      res.status(400).json({ error: 'invalid chain' })
      return
    }

    const hash = await walletContract(address, body.chain).getTransactionHash(body.nonce, body.to, body.value, body.data)

    if (hash !== body.hash) {
      res.status(400).json({ error: 'invalid hash' })
      return
    }

    const recoveredSigner = ethers.utils.recoverAddress(ethers.utils.hashMessage(ethers.utils.arrayify(body.hash)), body.signature)
    // const chainRecoveredAddress = await walletContract(address, body.chain).recover(body.hash, body.signature)

    if (recoveredSigner !== signer) {
      res.status(400).json({ error: 'invalid signer' })
      return
    }

    const isOwner = await walletContract(address, body.chain).isOwner(recoveredSigner)

    if (!isOwner) {
      res.status(400).json({ error: 'not an owner' })
      return
    }

    const did = await generateDid(process.env.DID_KEY!)
    ceramic.did = did
    const chainDoc = await loadDocumentByMetadata(ceramic.did.id, family, [`wallet:${address}`, `chain:${body.chain}`])

    let chainContent: MultiSigDeployment
    if (chainDoc.content == null || Object.keys(chainDoc.content).length === 0) {
      chainContent = {
        chain: body.chain,
        address,
        transactions: {},
      } as MultiSigDeployment
    } else {
      chainContent = chainDoc.content as MultiSigDeployment
    }

    if (chainContent.transactions[body.hash] === undefined) {
      chainContent.transactions[body.hash] = {
        nonce: body.nonce,
        to,
        data: body.data,
        value: body.value,
        chainId: body.chain,
        signatures: {},
      }
    }

    if (chainContent.transactions[body.hash].signatures[signer] === undefined) {
      chainContent.transactions[body.hash].signatures[signer] = {
        signer,
        signature: body.signature,
      }

      await chainDoc.update(chainContent)
      console.log('updated chain doc', chainDoc.id.toString())
    } else {
      console.log('already signed by this signer, skipping update')
    }

    res.status(200).json({ ok: true })
    return
  } else {
    res.status(400).json({ error: 'bad request' })
    return
  }
}
