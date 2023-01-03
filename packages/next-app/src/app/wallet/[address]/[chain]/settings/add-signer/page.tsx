'use client'
import { Input, Text, NumberInput, NumberInputField, Button, FormLabel, useDisclosure } from '@chakra-ui/react'
import { SignTransactionButton } from 'components/SignTransactionButton'
import { SignTransactionModal } from 'components/SignTransactionModal'
import { ethers } from 'ethers'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { useState } from 'react'
import { walletContract } from 'utils/contracts'

export default function Page(props: any) {
  const [newAddress, setNewAddress] = useState('')
  const { address, signaturesRequired, owners, chain } = useMultiSigWallet()
  const maxSignatures = owners.length + 1
  const [newSignaturesRequired, setNewSignaturesRequired] = useState(signaturesRequired?.toNumber())

  const handleAddressChange = (event: any) => setNewAddress(event.target.value)
  const isAddress = newAddress.length > 0 && ethers.utils.isAddress(newAddress)

  const callData = isAddress ? walletContract(address, chain).interface.encodeFunctionData('addSigner', [newAddress, newSignaturesRequired]) : '0x'

  return (
    <>
      <FormLabel mt={2}>New Owner</FormLabel>
      <Input value={newAddress} onChange={handleAddressChange} isInvalid={!isAddress} placeholder="Signer Address" />
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
        buttonText="Add Signer"
        disabled={!isAddress}
      />
    </>
  )
}
