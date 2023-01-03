import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { parseUri } from '@walletconnect/utils'
import { RequestOrProposal, WalletConnectPairing } from './types'
import { useLegacyWalletConnect } from './hooks/useLegacyWalletConnect'
import { useWalletConnect } from './hooks/useWalletConnect'
import LegacySignClient from '@walletconnect/client'
import SignClient from '@walletconnect/sign-client'
import { useWalletConnectPairings } from './hooks/useWalletConnectPairings'

interface WalletConnectQuery {
  signClient?: SignClient
  onConnect: (uri: string) => Promise<boolean>
  loading: boolean
  requests: RequestOrProposal[]
  removeRequest: () => void
  legacySignClient?: LegacySignClient
  pairings: WalletConnectPairing[]
  updatePairings: () => void
}

interface Props {
  children?: React.ReactNode
}

export const WalletConnectContext = React.createContext<WalletConnectQuery>({} as WalletConnectQuery)

export const useWalletConnectContext = () => {
  const walletConnectContext = useContext(WalletConnectContext)

  if (walletConnectContext === undefined) {
    throw new Error('useWalletConnectContext must be used within a MultiSigWallet.Provider')
  }

  return walletConnectContext
}

export const WalletConnectProvider: FC<Props> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<RequestOrProposal[]>([])

  const addNewRequest = useCallback((request: RequestOrProposal) => {
    setRequests((prevRequests) => [...prevRequests, request])
  }, [])

  const removeRequest = useCallback(() => {
    const [first, ...rest] = requests
    setRequests(rest)
  }, [requests])

  const { signClient } = useWalletConnect(addNewRequest)
  const { newLegacySignClient, legacySignClient } = useLegacyWalletConnect(addNewRequest)

  const { pairings, updatePairings } = useWalletConnectPairings(legacySignClient, signClient)

  const onConnect = useCallback(
    async (uri: string) => {
      try {
        setLoading(true)
        const { version } = parseUri(uri)

        if (version === 1) {
          newLegacySignClient(uri)
        } else {
          await signClient?.pair({ uri })
        }
        return true
      } catch (err: unknown) {
        alert(err)
        return false
      } finally {
        setLoading(false)
      }
    },
    [newLegacySignClient, signClient]
  )

  return (
    <WalletConnectContext.Provider
      value={{
        onConnect,
        loading,
        requests,
        removeRequest,
        legacySignClient,
        signClient,
        pairings,
        updatePairings,
      }}>
      {children}
    </WalletConnectContext.Provider>
  )
}

export default WalletConnectProvider
