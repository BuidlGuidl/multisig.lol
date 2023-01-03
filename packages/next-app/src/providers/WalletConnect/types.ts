import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { IClientMeta, IWalletConnectSession } from '@walletconnect/legacy-types'

/**
 * Types
 */

export type LegacyRequest = {
  type: 'legacyRequest'
  legacyCallRequestEvent: { id: number; method: string; params: any[] }
  legacyRequestSession: IWalletConnectSession
}

export type SessionRequest = {
  type: 'sessionRequest'
  requestEvent: SignClientTypes.EventArguments['session_request']
  requestSession: SessionTypes.Struct
}

export type LegacyProposalProposal = {
  id: number
  params: [{ chainId: number; peerId: string; peerMeta: IClientMeta }]
}

export type LegacyProposal = {
  type: 'legacyProposal'
  proposal: LegacyProposalProposal
}

export type SessionProposal = {
  type: 'sessionProposal'
  proposal: SignClientTypes.EventArguments['session_proposal']
}

export type RequestOrProposal = LegacyRequest | SessionRequest | LegacyProposal | SessionProposal

export type AddNewRequest = (request: RequestOrProposal) => void

export type WalletConnectPairing = {
  type: 'legacy' | 'v2'
  topic: string
  active: boolean
  logo?: string
  url?: string
  name?: string
}
