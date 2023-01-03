import { configureChains } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from '@wagmi/core/providers/public'
import { ETH_CHAINS } from 'utils/config'

export const { provider, webSocketProvider } = configureChains(
  ETH_CHAINS,
  [alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '' }), publicProvider()],
  { pollingInterval: 6000 }
)
