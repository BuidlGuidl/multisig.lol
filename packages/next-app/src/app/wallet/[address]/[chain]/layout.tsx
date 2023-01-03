'use client'

import { Heading, Text, Flex, Tab, TabList, Tabs } from '@chakra-ui/react'
import { AvatarAddress } from 'components/AvatarAddress'
import SwitchNetworkWrapper from 'components/SwitchNetwork'
import { Avatar } from 'connectkit'
import { usePathname, useRouter } from 'next/navigation'
import MultiSigWalletProvider from 'providers/MultiSigWallet'

export default function WalletLayout(props: any) {
  const { push } = useRouter()
  const pathname = usePathname()
  const basePath = `/wallet/${props.params.address}/${props.params.chain}`
  const menuItems = [
    {
      label: 'Home',
      href: basePath,
    },
    {
      label: 'Pool',
      href: `${basePath}/pool`,
    },
    {
      label: 'Transactions',
      href: `${basePath}/transactions`,
    },
    {
      label: 'Settings',
      href: `${basePath}/settings`,
    },
    {
      label: 'Connect',
      href: `${basePath}/connect`,
    },
  ]
  const chainId = Number(props.params.chain)
  return (
    <SwitchNetworkWrapper chainId={chainId}>
      <MultiSigWalletProvider address={props.params.address} chain={chainId}>
        {' '}
        <Heading as="h2">
          <Flex align={'center'} gap={2}>
            <AvatarAddress size="3xl" address={props.params.address} copyable={true} />
          </Flex>
        </Heading>
        <Tabs
          index={menuItems.findIndex((x) => pathname === x.href || (pathname?.includes(x.href) && x.href !== basePath))}
          onChange={(index) => {
            push(menuItems[index].href)
          }}>
          <TabList>
            {menuItems.map((x) => (
              <Tab key={x.href}>
                <Text>{x.label}</Text>
              </Tab>
            ))}
          </TabList>
        </Tabs>
        {props.children}
      </MultiSigWalletProvider>
    </SwitchNetworkWrapper>
  )
}
