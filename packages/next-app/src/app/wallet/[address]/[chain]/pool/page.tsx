'use client'
import { List, ListItem, Flex } from '@chakra-ui/react'
import { PoolTransaction } from 'components/PoolTransaction'
import { useMultiSigWallet } from 'providers/MultiSigWallet'

export default function Page(props: any) {
  const { transactions, nonce } = useMultiSigWallet()
  const filteredTransactions = nonce && transactions?.filter((t) => t[1].nonce >= nonce.toNumber())
  return (
    <List>
      {nonce && filteredTransactions && filteredTransactions.length > 0 ? (
        filteredTransactions
          .filter((t) => t[1].nonce >= nonce.toNumber())
          .map((transaction, index) => (
            <ListItem key={transaction[0]}>
              <PoolTransaction key={transaction[0]} id={transaction[0]} transaction={transaction[1]} />
            </ListItem>
          ))
      ) : (
        <Flex mt="2" justify={'center'}>
          No transactions in the pool
        </Flex>
      )}
    </List>
  )
}
