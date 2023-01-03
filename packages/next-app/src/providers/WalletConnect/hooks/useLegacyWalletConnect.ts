import { useCallback, useEffect, useRef, useState } from 'react'
import { createLegacySignClient, deleteCachedLegacySession } from '../utils/LegacyWalletConnectUtil'
import { AddNewRequest, LegacyProposal, RequestOrProposal } from '../types'
import LegacySignClient from '@walletconnect/client'

interface Props {
  addNewRequest: (request: RequestOrProposal) => void
}

export const useLegacyWalletConnect = (addNewRequest: AddNewRequest) => {
  const [legacySignClient, setLegacySignClient] = useState<LegacySignClient | undefined>(undefined)
  const initialized = useRef(false)

  const newLegacySignClient = useCallback((uri: string) => {
    const newSignClient = createLegacySignClient({ uri })
    setLegacySignClient(newSignClient)
  }, [])

  useEffect(() => {
    const initializeSignClient = async () => {
      initialized.current = true
      console.log('initializing Legacy WalletConnect client')
      try {
        const newSignClient = await createLegacySignClient()
        setLegacySignClient(newSignClient)
      } catch (err: unknown) {
        console.log('error initializing WalletConnect client', err)
        initialized.current = false
      }
    }
    if (!legacySignClient && initialized.current === false) {
      initializeSignClient()
    }
  }, [legacySignClient])

  useEffect(() => {
    console.log('trying to initialize', legacySignClient)
    if (legacySignClient) {
      console.log('initializing LegacyWalletConnect events', legacySignClient)
      legacySignClient.on('session_request', (error, payload) => {
        if (error) {
          throw new Error(`legacySignClient > session_request failed: ${error}`)
        }
        console.log('session_request', payload)
        addNewRequest({ type: 'legacyProposal', proposal: payload } as LegacyProposal)
      })

      legacySignClient.on('connect', () => {
        console.log('legacySignClient > connect')
      })

      legacySignClient.on('error', (error) => {
        throw new Error(`legacySignClient > on error: ${error}`)
      })

      legacySignClient.on('call_request', (error, payload) => {
        if (error) {
          throw new Error(`legacySignClient > call_request failed: ${error}`)
        }
        addNewRequest({ type: 'legacyRequest', legacyCallRequestEvent: payload, legacyRequestSession: legacySignClient.session })
      })

      legacySignClient.on('disconnect', async () => {
        deleteCachedLegacySession()
      })
    }
  }, [addNewRequest, legacySignClient])

  return { newLegacySignClient, legacySignClient }
}
