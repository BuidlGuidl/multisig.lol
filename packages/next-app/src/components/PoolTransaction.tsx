'use client'
import { Divider, Flex, Heading, List, ListItem } from '@chakra-ui/react'
import { AvatarAddress } from 'components/AvatarAddress'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { PoolTransaction as PoolTransactionType } from 'types'
import { FC } from 'react'
import { DecodedTransaction } from './DecodedTransaction'
import { ExecuteTransactionButton } from './ExecuteTransactionButton'
import { SignTransactionButton } from './SignTransactionButton'
import { useAccount } from 'wagmi'

interface Props {
  id: string
  transaction: PoolTransactionType
}

export const PoolTransaction: FC<Props> = ({ id, transaction }) => {
  const { nonce, isOwner, signaturesRequired } = useMultiSigWallet()
  const { address } = useAccount()
  const hasSigned = Object.values(transaction.signatures).some((signature) => signature.signer == address)
  const signatureCount = Object.values(transaction.signatures).length
  return (
    <Flex my="2" direction={'column'} gap="2">
      <Heading size="md">{`#${transaction.nonce}: ${id.slice(0, 5)}`}</Heading>
      <DecodedTransaction transaction={transaction} />
      <List>
        <Heading size="sm">{`Signatures: ${signatureCount} / ${signaturesRequired ? signaturesRequired?.toNumber() : '...'}`}</Heading>
        {Object.values(transaction.signatures).map((signature, index) => (
          <ListItem key={index}>
            <Flex align="center" gap={2}>
              <AvatarAddress address={signature.signer} />
              {signature.signature.substring(0, 10)}
            </Flex>
          </ListItem>
        ))}
      </List>
      {isOwner && nonce && transaction.nonce == nonce.toNumber() && signaturesRequired && signatureCount >= signaturesRequired.toNumber() && (
        <ExecuteTransactionButton transaction={transaction} />
      )}
      {isOwner && !hasSigned && signaturesRequired && signatureCount < signaturesRequired.toNumber() && (
        <SignTransactionButton transaction={transaction} fixedNonce={transaction.nonce} />
      )}
      <Divider />
    </Flex>
  )
}
