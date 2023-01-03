import { IWalletConnectSession } from '@walletconnect/legacy-types'
import LegacySignClient from '@walletconnect/client'
import { EIP155_SIGNING_METHODS } from './constants'
import { LegacyProposal, LegacyProposalProposal, LegacyRequest } from '../types'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@json-rpc-tools/utils'

export let legacySignClient: LegacySignClient

export function createLegacySignClient({ uri }: { uri?: string } = {}) {
  // If URI is passed always create a new session,
  // otherwise fall back to cached session if client isn't already instantiated.
  if (uri) {
    deleteCachedLegacySession()
    legacySignClient = new LegacySignClient({ uri })
  } else if (!legacySignClient && getCachedLegacySession()) {
    const session = getCachedLegacySession()
    legacySignClient = new LegacySignClient({ session })
  } else {
    return
  }
  return legacySignClient
}

const onCallRequest = async (payload: { id: number; method: string; params: any[] }) => {
  switch (payload.method) {
    case EIP155_SIGNING_METHODS.ETH_SIGN:
    case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
      console.log(payload, legacySignClient.session)
      return

    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
      console.log(payload, legacySignClient.session)
      return

    case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
      console.log(payload, legacySignClient.session)
      return

    default:
      alert(`${payload.method} is not supported for WalletConnect v1`)
  }
}

export function getCachedLegacySession(): IWalletConnectSession | undefined {
  if (typeof window === 'undefined') return

  const local = window.localStorage ? window.localStorage.getItem('walletconnect') : null

  let session = null
  if (local) {
    try {
      session = JSON.parse(local)
    } catch (error) {
      throw error
    }
  }
  return session
}

export function deleteCachedLegacySession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('walletconnect')
}

export function onApproveLegacyProposal(legacySignClient: LegacySignClient, proposal: LegacyProposalProposal, selectedAccounts: string[]) {
  // Get required proposal data

  const { id, params } = proposal
  const [{ chainId, peerMeta }] = params

  legacySignClient.approveSession({
    accounts: selectedAccounts,
    chainId: chainId ?? 1,
  })
}
// Handle reject action
export function onRejectLegacyProposal(legacySignClient: LegacySignClient) {
  legacySignClient.rejectSession(getSdkError('USER_REJECTED_METHODS'))
}

export async function rejectLegacyRequest(request: LegacyRequest) {
  const { error } = formatJsonRpcError(request.legacyCallRequestEvent.id, getSdkError('USER_REJECTED_METHODS').message)
  legacySignClient.rejectRequest({
    id: request.legacyCallRequestEvent.id,
    error,
  })
}
