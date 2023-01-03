'use client'
import { Card, CardBody, Flex, List, ListItem, Text } from '@chakra-ui/react'
import { decodeMultiSigTransaction, useMultiSigWallet } from 'providers/MultiSigWallet'
import { SimpleTransaction } from 'types'
import { FC } from 'react'
import { ethers } from 'ethers'
import { ExternalTransaction } from './ExternalTransaction'
import { AvatarAddress } from './AvatarAddress'

interface Props {
  transaction: SimpleTransaction
}

export const InternalTransaction: FC<Props> = ({ transaction }) => {
  const parsedTransaction = decodeMultiSigTransaction(transaction)

  if (parsedTransaction.name === 'addSigner') {
    return (
      <Flex alignItems="center">
        {`Add `}
        <AvatarAddress address={parsedTransaction.args[0]} />
        {` as signer, with threshold ${parsedTransaction.args[1]}`}
      </Flex>
    )
  }
  if (parsedTransaction.name === 'removeSigner') {
    return (
      <Flex alignItems="center">
        {`Remove `}
        <AvatarAddress address={parsedTransaction.args[0]} />
        {` as signer, with threshold ${parsedTransaction.args[1]}`}
      </Flex>
    )
  }
  if (parsedTransaction.name === 'updateSignaturesRequired') {
    return <Flex alignItems="center">{`Update the threshold to ${parsedTransaction.args[0]} signatures`}</Flex>
  }
  return <Text>{`${parsedTransaction.name}: ${parsedTransaction.args.toString()} to ${transaction.to}`}</Text>
}
