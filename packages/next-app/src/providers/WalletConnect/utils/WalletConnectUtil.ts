import SignClient from '@walletconnect/sign-client'
import { SignClientTypes, SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@json-rpc-tools/utils'
import { SessionRequest } from '../types'

export let signClient: SignClient

export async function createSignClient() {
  signClient = await SignClient.init({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    relayUrl: process.env.NEXT_PUBLIC_RELAY_URL,
    metadata: {
      name: 'multisig.lol',
      description: 'A multisig but more fun',
      url: 'https://multisig.lol/',
      icons: ['https://avatars.githubusercontent.com/u/37784886'],
    },
  })
  return signClient
}

// Hanlde approve action, construct session namespace
export async function onApproveProposal(proposal: SignClientTypes.EventArguments['session_proposal'], selectedAccounts: string[]) {
  const { id, params } = proposal
  const { proposer, requiredNamespaces, relays } = params
  const namespaces: SessionTypes.Namespaces = {}
  Object.keys(requiredNamespaces).forEach((key) => {
    const accounts: string[] = []
    requiredNamespaces[key].chains.map((chain) => {
      selectedAccounts.map((acc) => accounts.push(`${chain}:${acc}`))
    })
    namespaces[key] = {
      accounts,
      methods: requiredNamespaces[key].methods,
      events: requiredNamespaces[key].events,
    }
  })

  const { acknowledged } = await signClient.approve({
    id,
    relayProtocol: relays[0].protocol,
    namespaces,
  })
  await acknowledged()
}

// Hanlde reject action
export async function onRejectProposal(proposal: SignClientTypes.EventArguments['session_proposal']) {
  const { id, params } = proposal
  await signClient.reject({
    id,
    reason: getSdkError('USER_REJECTED_METHODS'),
  })
}

export async function rejectSessionRequest(request: SessionRequest) {
  const response = formatJsonRpcError(request.requestEvent.id, getSdkError('USER_REJECTED_METHODS').message)
  await signClient.respond({
    topic: request.requestEvent.topic,
    response,
  })
}
