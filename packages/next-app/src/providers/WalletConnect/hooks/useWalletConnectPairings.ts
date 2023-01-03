import { useEffect, useMemo, useState, useRef, useCallback } from 'react'

import { WalletConnectPairing } from '../types'
import LegacySignClient from '@walletconnect/client'
import SignClient from '@walletconnect/sign-client'
import { useInterval } from '@chakra-ui/react'

export const useWalletConnectPairings = (legacySignClient?: LegacySignClient, signClient?: SignClient) => {
  const [pairings, setPairings] = useState<WalletConnectPairing[]>([])
  const id = useRef('')

  const updatePairings = useCallback(() => {
    const legacyId = legacySignClient ? JSON.stringify(legacySignClient?.peerId) : ''
    const v2Id = signClient?.pairing ? JSON.stringify(signClient?.pairing?.values) : ''
    const newId = legacyId + v2Id
    if (newId !== id.current) {
      let newPairings: WalletConnectPairing[] = []
      if (signClient?.pairing?.values) {
        const signClientPairings: WalletConnectPairing[] = signClient.pairing.values.map((pairing) => {
          return {
            type: 'v2',
            topic: pairing.topic,
            active: pairing.active,
            name: pairing.peerMetadata?.name,
            url: pairing.peerMetadata?.url,
            logo: pairing.peerMetadata?.icons[0],
          }
        })
        newPairings = signClientPairings.filter((pairing) => pairing.active)
      }
      if (legacySignClient && legacySignClient.peerId.length > 0) {
        console.log('pushing this')
        newPairings.push({
          type: 'legacy',
          topic: legacySignClient.peerId,
          active: true,
          name: legacySignClient?.peerMeta?.name,
          url: legacySignClient?.peerMeta?.url,
          logo: legacySignClient?.peerMeta?.icons[0],
        } as WalletConnectPairing)
      }

      console.log('updating pairings', newId, id.current)
      setPairings(newPairings)
      id.current = newId
    }
  }, [legacySignClient, signClient])

  useEffect(() => {
    updatePairings()
  }, [updatePairings])

  useInterval(updatePairings, 3000)

  return { pairings, updatePairings }
}
