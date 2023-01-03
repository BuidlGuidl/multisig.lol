import { createClient, WagmiConfig } from 'wagmi'
import { provider, webSocketProvider } from 'utils/provider'
import { ConnectKitProvider, getDefaultClient } from 'connectkit'
import { ETH_CHAINS, SITE_NAME } from 'utils/config'
import { useColorMode } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const client = createClient(
  getDefaultClient({
    appName: SITE_NAME,
    autoConnect: true,
    provider,
    webSocketProvider,
    chains: ETH_CHAINS,
  })
)

export function Web3Provider(props: Props) {
  const { colorMode } = useColorMode()

  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider mode={colorMode}>{props.children}</ConnectKitProvider>
    </WagmiConfig>
  )
}
