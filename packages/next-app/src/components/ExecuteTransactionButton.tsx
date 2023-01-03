'use client'
import { Button, useDisclosure } from '@chakra-ui/react'
import { useExecuteTransaction, useMultiSigWallet } from 'providers/MultiSigWallet'
import { PoolTransaction as PoolTransactionType } from 'types'
import { FC } from 'react'
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from '@chakra-ui/react'
import useTransactor from 'hooks/useTransactor'
import { useRouter } from 'next/navigation'

interface Props {
  transaction: PoolTransactionType
}

export const ExecuteTransactionButton: FC<Props> = ({ transaction }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { writeAsync, error } = useExecuteTransaction(transaction, isOpen)
  const { transactor, loading } = useTransactor()
  const { push } = useRouter()
  const { chain, address, refetchOnChain } = useMultiSigWallet()

  return (
    <>
      <Button onClick={onOpen}>Execute</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Execute Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you ready?</p>
          </ModalBody>

          <ModalFooter>
            <Button
              onClick={() => {
                transactor(writeAsync?.(), (tx: any) => {
                  console.log(tx)
                  refetchOnChain()
                  push(`/wallet/${address}/${chain}/transactions`)
                })
              }}
              isLoading={loading}>
              Execute
            </Button>
            <Button variant="ghost" colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
