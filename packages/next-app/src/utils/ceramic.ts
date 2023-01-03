import { CeramicClient } from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from 'key-did-resolver'
import { fromString } from 'uint8arrays'

// Connect to the local Ceramic node
export const ceramic = new CeramicClient('https://ceramic-clay.3boxlabs.com')

// seed must be 64 characters long, base16 encoded
export async function generateDid(seed: string) {
  const key = fromString(seed, 'base16')
  const provider = new Ed25519Provider(key)
  const did = new DID({ provider, resolver: getResolver() })
  await did.authenticate()

  return did
}

export const NO_OP_CREATE_OPTS = {
  anchor: false,
  publish: false,
  pin: false,
}

export const PERSIST_CREATE_OPTS = {
  anchor: false,
  publish: true,
  pin: true,
}

// Load (or create) a determinitic document for a given controller
export async function loadDocumentByMetadata(controller: string, family: string, tags: string[], opts: typeof NO_OP_CREATE_OPTS = NO_OP_CREATE_OPTS) {
  return await TileDocument.deterministic(
    ceramic,
    {
      // A single controller must be provided to reference a deterministic document
      controllers: [controller],
      // A family or tag must be provided in addition to the controller
      family: family,
      tags: tags,
    },
    opts
  )
}

export const family = 'multisig.lol_dev'

export const generateTag = (value: string | number, type: 'wallet' | 'chain') => {
  switch (type) {
    case 'wallet':
      return `wallet:${value}`
    case 'chain':
      return `chain:${value}`
  }
}
