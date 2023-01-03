import { ThemingProps } from '@chakra-ui/react'
import { mainnet, goerli, polygon, optimism, arbitrum, gnosis, sepolia } from '@wagmi/chains'

export const SITE_NAME = 'Multisig.lol'
export const SITE_DESCRIPTION = 'A fun and cool multisig for you and your friends.'

export const THEME_INITIAL_COLOR = 'system'
export const THEME_COLOR_SCHEME: ThemingProps['colorScheme'] = 'gray'
export const THEME_CONFIG = {
  initialColorMode: THEME_INITIAL_COLOR,
}

export const SOCIAL_TWITTER = 'buidlguidl'
export const SOCIAL_GITHUB = 'buidlguidl/multisig.lol'

export const ETH_CHAINS = [mainnet, goerli, polygon, optimism, arbitrum, gnosis, sepolia]
export const ETH_CHAINS_IDS = ETH_CHAINS.map((chain) => chain.id)
export type EthChainId = typeof ETH_CHAINS_IDS[number]

export const ETHERSCAN_API_URLS = {
  [mainnet.id]: 'https://api.etherscan.io/api',
  [goerli.id]: 'https://api-goerli.etherscan.io/api',
  [polygon.id]: 'https://api.polygonscan.com/api',
  [arbitrum.id]: 'https://arbiscan.io/api',
  [optimism.id]: 'https://api-optimistic.etherscan.io/api',
  [gnosis.id]: 'https://api.gnosisscan.io/api',
  [sepolia.id]: 'https://api-sepolia.etherscan.io/api',
}
