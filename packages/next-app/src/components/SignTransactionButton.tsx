'use client'
import { Button, useDisclosure } from '@chakra-ui/react'
import { PoolTransaction as PoolTransactionType, SimpleTransaction } from 'types'
import { FC } from 'react'
import { SignTransactionModal } from './SignTransactionModal'

interface Props {
  transaction: SimpleTransaction
  fixedNonce?: number
  buttonText?: string
  disabled?: boolean
}

export const SignTransactionButton: FC<Props> = ({ transaction, fixedNonce, buttonText, disabled }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button onClick={onOpen} disabled={disabled}>
        {buttonText || 'Sign'}
      </Button>
      <SignTransactionModal isOpen={isOpen} onClose={onClose} transaction={transaction} fixedNonce={fixedNonce} />
    </>
  )
}
