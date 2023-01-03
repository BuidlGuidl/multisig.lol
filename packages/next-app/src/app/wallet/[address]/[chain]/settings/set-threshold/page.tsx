'use client'
import { NumberInput, NumberInputField, FormLabel } from '@chakra-ui/react'
import { SignTransactionButton } from 'components/SignTransactionButton'
import { ethers } from 'ethers'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { useState } from 'react'
import { walletContract } from 'utils/contracts'

export default function Page(props: any) {
  const { address, signaturesRequired, owners, chain } = useMultiSigWallet()
  const maxSignatures = owners.length - 1
  const [newSignaturesRequired, setNewSignaturesRequired] = useState(signaturesRequired?.toNumber())

  const callData = walletContract(address, chain).interface.encodeFunctionData('updateSignaturesRequired', [newSignaturesRequired])

  return (
    <>
      <FormLabel mt={2}>New Signatures Required</FormLabel>
      <NumberInput
        min={1}
        max={maxSignatures}
        value={newSignaturesRequired}
        onChange={(valueString) => setNewSignaturesRequired(Number(valueString))}>
        <NumberInputField />
      </NumberInput>

      <SignTransactionButton
        transaction={{
          to: address,
          data: callData,
          value: ethers.constants.Zero.toHexString(),
        }}
        buttonText="Set signatures"
        disabled={newSignaturesRequired === signaturesRequired?.toNumber()}
      />
    </>
  )
}
