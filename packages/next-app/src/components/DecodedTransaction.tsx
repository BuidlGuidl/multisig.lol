'use client'
import { Button, Card, CardBody, Flex, List, ListItem, Text, useDisclosure } from '@chakra-ui/react'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { SimpleTransaction } from 'types'
import { FC } from 'react'
import { ethers } from 'ethers'
import { ExternalTransaction } from './ExternalTransaction'
import { InternalTransaction } from './InternalTransaction'
import { AvatarAddress } from './AvatarAddress'
import { useNetwork } from 'wagmi'

interface Props {
  transaction: SimpleTransaction
}

export const DecodedTransaction: FC<Props> = ({ transaction }) => {
  const { address } = useMultiSigWallet()
  const { isOpen, onToggle } = useDisclosure()
  const { chain } = useNetwork()

  const showDecoded = () => {
    if (transaction.data === '0x') {
      return (
        <Flex alignItems="center" gap="1">
          <Text>{`Transfer: ${ethers.utils.formatEther(transaction.value)} ${chain?.nativeCurrency.name || 'ETH'} to`}</Text>
          <AvatarAddress address={transaction.to} />
        </Flex>
      )
    } else if (address === transaction.to) {
      return <InternalTransaction transaction={transaction} />
    } else {
      return <ExternalTransaction transaction={transaction} />
    }
  }

  return (
    <Card>
      <CardBody>
        {showDecoded()}
        <Button variant="link" onClick={onToggle}>
          {isOpen ? 'Hide details' : 'Show details'}
        </Button>
        {isOpen && (
          <List>
            <ListItem>{`To: ${transaction.to}`}</ListItem>
            <ListItem>{`Value: ${ethers.utils.formatEther(transaction.value)}`}</ListItem>
            <ListItem>{`Data: ${transaction.data}`}</ListItem>
          </List>
        )}
      </CardBody>
    </Card>
  )
}
