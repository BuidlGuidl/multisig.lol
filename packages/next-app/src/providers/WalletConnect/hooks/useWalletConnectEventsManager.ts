import { SignClientTypes } from '@walletconnect/types'
import { useCallback, useEffect } from 'react'
import { EIP155_SIGNING_METHODS } from '../utils/constants'
import { signClient } from '../utils/WalletConnectUtil'

export default function useWalletConnectEventsManager(initialized: boolean) {
  /******************************************************************************
   * 1. Open session proposal modal for confirmation / rejection
   *****************************************************************************/
  const onSessionProposal = useCallback((proposal: SignClientTypes.EventArguments['session_proposal']) => {
    console.log('session_proposal', proposal)
  }, [])

  /******************************************************************************
   * 3. Open request handling modal based on method that was used
   *****************************************************************************/
  const onSessionRequest = useCallback(async (requestEvent: SignClientTypes.EventArguments['session_request']) => {
    console.log('session_request', requestEvent)
    const { topic, params } = requestEvent
    const { request } = params
    const requestSession = signClient.session.get(topic)

    switch (request.method) {
      case EIP155_SIGNING_METHODS.ETH_SIGN:
      case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
        console.log(request.method, requestSession)
        return

      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
        console.log(request.method, requestSession)
        return

      case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
        console.log(request.method, requestSession)
        return

      default:
        console.log(request.method, requestSession)
        return
    }
  }, [])

  /******************************************************************************
   * Set up WalletConnect event listeners
   *****************************************************************************/
  useEffect(() => {
    if (initialized) {
      console.log('initializing WalletConnect events')
      signClient.on('session_proposal', onSessionProposal)
      signClient.on('session_request', onSessionRequest)
      // TODOs
      signClient.on('session_ping', (data) => console.log('ping', data))
      signClient.on('session_event', (data) => console.log('event', data))
      signClient.on('session_update', (data) => console.log('update', data))
      signClient.on('session_delete', (data) => console.log('delete', data))
    }
  }, [initialized, onSessionProposal, onSessionRequest])
}
