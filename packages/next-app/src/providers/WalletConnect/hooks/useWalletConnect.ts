import { useCallback, useEffect, useRef, useState } from 'react'
import { createSignClient } from '../utils/WalletConnectUtil'
import { SignClientTypes } from '@walletconnect/types'
import { AddNewRequest } from '../types'
import SignClient from '@walletconnect/sign-client'

export const useWalletConnect = (addNewRequest: AddNewRequest) => {
  const [signClient, setSignClient] = useState<SignClient | undefined>(undefined)
  const initialized = useRef(false)

  useEffect(() => {
    const initializeSignClient = async () => {
      initialized.current = true
      console.log('initializing WalletConnect client')
      try {
        const newSignClient = await createSignClient()
        setSignClient(newSignClient)
      } catch (err: unknown) {
        console.log('error initializing WalletConnect client', err)
        initialized.current = false
      }
    }
    if (!signClient && initialized.current === false) {
      initializeSignClient()
    }
  }, [signClient])

  const onSessionProposal = useCallback(
    (proposal: SignClientTypes.EventArguments['session_proposal']) => {
      console.log('session_proposal', proposal)
      addNewRequest({ type: 'sessionProposal', proposal })
    },
    [addNewRequest]
  )

  const onSessionRequest = useCallback(
    async (requestEvent: SignClientTypes.EventArguments['session_request']) => {
      if (signClient) {
        console.log('session_request', requestEvent)
        const { topic } = requestEvent
        const requestSession = signClient.session.get(topic)
        addNewRequest({ type: 'sessionRequest', requestSession, requestEvent })
      }
    },
    [addNewRequest, signClient]
  )

  useEffect(() => {
    if (signClient) {
      // console.log('initializing WalletConnect events')
      signClient.on('session_proposal', onSessionProposal)
      signClient.on('session_request', onSessionRequest)
      // TODOs
      signClient.on('session_ping', (data) => console.log('ping', data))
      signClient.on('session_event', (data) => console.log('event', data))
      signClient.on('session_update', (data) => console.log('update', data))
      signClient.on('session_delete', (data) => console.log('delete', data))
    }
    return () => {
      if (signClient) {
        // sconsole.log('uninitializing WalletConnect events')
        const signClientEvents: SignClientTypes.Event[] = [
          'session_proposal',
          'session_request',
          'session_ping',
          'session_event',
          'session_update',
          'session_delete',
        ]
        signClientEvents.forEach((event: SignClientTypes.Event) => signClient.removeAllListeners(event))
      }
    }
  }, [onSessionProposal, onSessionRequest, signClient])

  return { signClient }
}
