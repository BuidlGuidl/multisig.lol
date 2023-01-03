'use client'
import { SimpleTransaction } from 'types'
import { FC, useState } from 'react'
import {
  Button,
  NumberInput,
  NumberInputField,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  FormLabel,
} from '@chakra-ui/react'
import { DecodedTransaction } from './DecodedTransaction'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { useRouter } from 'next/navigation'

interface Props {
  transaction: SimpleTransaction
  isOpen: boolean
  onClose: () => void
  fixedNonce?: number
}

export const SignTransactionModal: FC<Props> = ({ transaction, isOpen, onClose, fixedNonce }) => {
  const { signTransactionAndSave, nonce, chain, address, refetchTransactions } = useMultiSigWallet()
  const [loading, setLoading] = useState(false)
  const [customNonce, setCustomNonce] = useState(nonce?.toNumber())
  const finalNonce = fixedNonce || customNonce
  const { push } = useRouter()
  const finalTransaction = (finalNonce || finalNonce === 0) && { ...transaction, nonce: finalNonce, chainId: chain }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Execute Transaction</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <DecodedTransaction transaction={transaction} />
          {fixedNonce ? (
            <FormLabel mt={2}>{`Nonce: ${fixedNonce}`}</FormLabel>
          ) : (
            <>
              <FormLabel mt={2}>Nonce</FormLabel>
              <NumberInput min={nonce?.toNumber()} value={customNonce} onChange={(valueString) => setCustomNonce(Number(valueString))}>
                <NumberInputField />
              </NumberInput>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            onClick={async () => {
              try {
                if (!finalTransaction) {
                  console.log('No transaction to sign')
                  return
                }
                setLoading(true)
                await signTransactionAndSave(finalTransaction)
                refetchTransactions()
                push(`/wallet/${address}/${chain}/pool`)
              } catch (e) {
                console.log(e)
                setLoading(false)
              }
            }}
            isLoading={loading}>
            Sign
          </Button>
          <Button variant="ghost" colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
