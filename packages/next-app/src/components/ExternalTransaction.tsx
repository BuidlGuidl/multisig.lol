'use client'
import { Text, Flex } from '@chakra-ui/react'
import { SimpleTransaction } from 'types'
import { FC } from 'react'
import useParseContractTransaction from 'hooks/useParseContractTransaction'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { AvatarAddress } from './AvatarAddress'
import { ethers } from 'ethers'
import { parseTransaction } from 'ethers/lib/utils.js'
import { useNetwork } from 'wagmi'

interface Props {
  transaction: SimpleTransaction
}

export const ExternalTransaction: FC<Props> = ({ transaction }) => {
  const { chain } = useMultiSigWallet()
  const { parsedTransaction, error } = useParseContractTransaction(transaction, chain)
  const { chain: wagmiChain } = useNetwork()

  const showDecoded = () => {
    if (parsedTransaction) {
      console.log(parsedTransaction.args)
      return (
        <>
          <Flex alignItems="center" gap="1">
            <Text>{`Call "${parsedTransaction.name}" on`}</Text>
            <AvatarAddress address={transaction.to} />
            {!parsedTransaction.value.isZero() &&
              ` sending ${ethers.utils.formatEther(parsedTransaction.value)} ${wagmiChain?.nativeCurrency.name || 'ETH'}`}
          </Flex>
          {parsedTransaction.functionFragment.inputs.length > 0 &&
            parsedTransaction.functionFragment.inputs.map((arg, index) => {
              const rawValue = parsedTransaction.args[arg.name]
              let formattedValue = rawValue.toString()
              if (['tuple', 'array'].includes(arg.type)) formattedValue = rawValue.toString()
              if (arg.type === 'uint256') {
                if (Number(ethers.utils.formatEther(rawValue)) > 0.0001) {
                  formattedValue = ethers.utils.formatEther(rawValue)
                } else {
                  formattedValue = rawValue.toString()
                }
              }
              return (
                <>
                  <Text noOfLines={2} key={index}>{`${arg.name}: ${formattedValue}`}</Text>
                </>
              )
            })}
        </>
      )
    } else {
      return (
        <Flex>
          <Text>{`Unable to decode transaction`}</Text>
          <AvatarAddress address={transaction.to} />
        </Flex>
      )
    }
  }
  return showDecoded()
}
