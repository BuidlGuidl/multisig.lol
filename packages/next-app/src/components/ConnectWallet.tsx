'use client'
import { Flex } from '@chakra-ui/react'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'

export default function ConnectWalletWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const { isConnected } = useAccount()
  if (!isConnected)
    return (
      <Flex justifyContent="center" alignItems="center" mt={8}>
        <ConnectKitButton />
      </Flex>
    )
  return <>{children}</>
}
