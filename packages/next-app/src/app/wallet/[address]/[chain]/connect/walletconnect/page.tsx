'use client'
import { Input, Text, Button, Flex, Box } from '@chakra-ui/react'
import { useState } from 'react'
import { useWalletConnectContext } from 'providers/WalletConnect'
import { getSdkError } from '@walletconnect/utils'
import PairingCard from 'components/PairingCard'
import { WalletConnectPairing } from 'providers/WalletConnect/types'

export default function Page() {
  const [uri, setUri] = useState<string>('')

  const { onConnect, loading, legacySignClient, signClient, pairings } = useWalletConnectContext()

  async function onDelete(pairing: WalletConnectPairing) {
    if (pairing.type === 'legacy') {
      legacySignClient?.killSession()
    } else if (pairing.type === 'v2') {
      const topic = pairing.topic
      await signClient?.disconnect({ topic, reason: getSdkError('USER_DISCONNECTED') })
    }
  }

  const renderPairings = () => {
    return (
      <>
        {pairings.length ? (
          pairings
            .filter((pairing) => pairing.active)
            .map((pairing) => {
              return <PairingCard key={pairing.topic} logo={pairing.logo} url={pairing.url} name={pairing.name} onDelete={() => onDelete(pairing)} />
            })
        ) : (
          <Text>No pairings</Text>
        )}
      </>
    )
  }

  return (
    <Flex direction="column" my="2">
      <Input
        placeholder="enter uri"
        onChange={(e) => {
          setUri(e.target.value)
        }}
        value={uri}
      />
      <Button
        isLoading={loading}
        disabled={uri.length === 0}
        onClick={() => {
          onConnect(uri)
        }}>
        Connect
      </Button>
      <Box my={'2'}>{renderPairings()}</Box>
    </Flex>
  )
}
