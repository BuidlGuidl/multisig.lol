'use client'
import { Button, Flex } from '@chakra-ui/react'
import { useNetwork, useSwitchNetwork } from 'wagmi'

export default function SwitchNetworkWrapper({ children, chainId }: { children: React.ReactNode; chainId: number }): JSX.Element {
  const { chain } = useNetwork()
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  if (!chain || chain.id !== chainId)
    return (
      <Flex flexDirection={'column'} justifyContent="center" alignItems="center" mt={8} gap={2}>
        {chain && <div>Connected to {chain.name}</div>}

        {chains
          .filter((x) => x.id === chainId)
          .map((x) => (
            <Button disabled={!switchNetwork || x.id === chain?.id} isLoading={isLoading} key={x.id} onClick={() => switchNetwork?.(x.id)}>
              {`Switch to ${x.name}`}
            </Button>
          ))}

        <div>{error && error.message}</div>
      </Flex>
    )
  return <>{children}</>
}
