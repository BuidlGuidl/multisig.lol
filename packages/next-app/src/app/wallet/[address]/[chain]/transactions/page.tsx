'use client'
import { List, ListItem, Link, Divider, Text, Heading, Flex } from '@chakra-ui/react'
import { DecodedTransaction } from 'components/DecodedTransaction'
import useEventListener from 'hooks/useEventListener'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { MULTISIG_ABI } from 'utils/contracts'
import { useNetwork } from 'wagmi'

export default function Page(props: any) {
  const { address } = useMultiSigWallet()
  const events = useEventListener(address, MULTISIG_ABI, 'ExecuteTransaction')
  const { chain } = useNetwork()

  return (
    <List>
      {events
        .map((executeEvent, index) => {
          const args = executeEvent.args
          if (args && args.nonce && args.to && args.value && args.data && chain?.id) {
            return (
              <ListItem key={index} my="2">
                <Heading size={'md'}>
                  <Flex gap="2">
                    <Text>{`#${executeEvent.args?.nonce}`}</Text>
                    <Link href={`${chain.blockExplorers?.default.url}/tx/${executeEvent.transactionHash}`} target="_blank">
                      {executeEvent.transactionHash}
                    </Link>
                  </Flex>
                </Heading>
                <DecodedTransaction
                  transaction={{
                    to: args.to,
                    value: args.value,
                    data: args.data,
                  }}></DecodedTransaction>
                <Divider />
              </ListItem>
            )
          }
        })
        .reverse()}
    </List>
  )
}
