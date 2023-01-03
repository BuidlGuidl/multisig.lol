'use client'
import { Button, Flex, Heading, List, ListItem, Text } from '@chakra-ui/react'
import { AvatarAddress } from 'components/AvatarAddress'
import useEventListener from 'hooks/useEventListener'
import Link from 'next/link'
import { SITE_DESCRIPTION, SITE_NAME } from 'utils/config'
import { FACTORY_ABI, FACTORY_DEPLOYMENTS } from 'utils/contracts'
import { useNetwork, useSwitchNetwork } from 'wagmi'

export default function Home() {
  const { chain } = useNetwork()
  const chainId = chain?.id || 1
  const factoryAddress = FACTORY_DEPLOYMENTS[chainId] as `0x${string}`
  const createEvents = useEventListener(factoryAddress, FACTORY_ABI, 'Create2Event')
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  return (
    <>
      <main>
        <Heading as="h2" my="2">
          {SITE_NAME}
        </Heading>
        <Flex align={'center'} gap={2} wrap="wrap" my="2">
          {chains.map((x) => (
            <Button
              disabled={!switchNetwork || x.id === chain?.id}
              isLoading={isLoading && pendingChainId === x.id}
              key={x.id}
              onClick={() => switchNetwork?.(x.id)}>
              {x.name}
            </Button>
          ))}
        </Flex>
        <Link href={'/create'}>
          <Button variant={'outline'}>Create</Button>
        </Link>
        <List mt={'2'}>
          {createEvents.map((event) => (
            <ListItem key={event.transactionHash}>
              <Link href={`/wallet/${event.args?.[2]}/${chainId}`}>
                <Flex align={'center'} gap={2}>
                  {event.args?.[1]}
                  <AvatarAddress address={event.args?.[2]} />
                </Flex>
              </Link>
            </ListItem>
          ))}
        </List>
      </main>
    </>
  )
}
