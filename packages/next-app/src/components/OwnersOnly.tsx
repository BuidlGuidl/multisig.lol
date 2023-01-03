'use client'
import { Flex, Text } from '@chakra-ui/react'
import { useMultiSigWallet } from 'providers/MultiSigWallet'

export default function OwnersOnlyWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const { isOwner } = useMultiSigWallet()
  if (!isOwner)
    return (
      <Flex justifyContent="center" alignItems="center" mt={8}>
        <Text>Sorry, this is for owners only 👀</Text>
      </Flex>
    )
  return <>{children}</>
}
