'use client'
import {
  Flex,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  FormControl,
  Button,
  InputGroup,
  InputRightElement,
  Text,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useState } from 'react'
import { CheckIcon, DeleteIcon } from '@chakra-ui/icons'
import { useAccount, useContractRead, useContractWrite, useNetwork, usePrepareContractWrite, useProvider } from 'wagmi'
import { ethers } from 'ethers'
import { provider } from 'utils/provider'
import { FACTORY_ABI, FACTORY_DEPLOYMENTS } from 'utils/contracts'
import useDebounce from 'hooks/useDebounce'
import { AvatarAddress } from 'components/AvatarAddress'
import useTransactor from 'hooks/useTransactor'
import { useRouter } from 'next/navigation'

const isENS = (address = '') => address.endsWith('.eth') || address.endsWith('.xyz')

export default function Page(props: any) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [owners, setOwners] = useState<{
    [key: number]: { address: string; ens?: string }
  }>({ 0: { address: address as string } })
  const [signaturesRequired, setSignaturesRequired] = useState(1)
  const [initialDeposit, setInitialDeposit] = useState<number | undefined>(undefined)
  const [ownerCount, setOwnerCount] = useState(1)
  const ownerArray = Array.apply(null, Array(ownerCount)).map(function () {})
  const [name, setName] = useState('')
  const debouncedName = useDebounce(name, 1000)
  const { transactor, loading } = useTransactor()
  const { push } = useRouter()

  const { data: predictedAddress } = useContractRead({
    address: FACTORY_DEPLOYMENTS[chain?.id || 1],
    abi: FACTORY_ABI,
    functionName: 'computedAddress',
    args: [debouncedName],
    enabled: address && debouncedName && debouncedName.length > 0,
    overrides: { from: address },
  })

  const areOwnersValid = () => {
    return (
      !!owners[0] &&
      Object.keys(owners).every((o) => {
        const index = Number(o)
        return ethers.utils.isAddress(owners[index].address)
      })
    )
  }

  const isValid = areOwnersValid() && name.length > 0 && signaturesRequired <= ownerCount

  const { config, error } = usePrepareContractWrite({
    address: FACTORY_DEPLOYMENTS[chain?.id || 1],
    abi: FACTORY_ABI,
    functionName: 'create2',
    args: [Object.values(owners).map((o) => o.address as `0x${string}`), ethers.BigNumber.from(signaturesRequired), name],
    overrides: { value: initialDeposit && ethers.utils.parseEther(String(initialDeposit)) },
    enabled: isValid,
  })

  const { writeAsync } = useContractWrite(config)

  return (
    <Flex direction={'column'}>
      <FormControl>
        <FormLabel>Name</FormLabel>
        <Input type="text" placeholder="Wallet name" value={name} onChange={(e) => setName(e.target.value)} />
        {predictedAddress && (
          <Flex align={'center'}>
            Will deploy at
            <AvatarAddress address={predictedAddress} />
          </Flex>
        )}
      </FormControl>
      <FormControl>
        <FormLabel>Owners</FormLabel>
        {ownerArray.map((o, index) => {
          return (
            <Flex align={'center'} key={index} gap="2">
              <InputGroup>
                <Input
                  placeholder="Owner"
                  onChange={async (e) => {
                    const value = e.target.value
                    setOwners({ ...owners, [index]: { address: value } })
                    if (isENS(value)) {
                      try {
                        const address = await provider({ chainId: 1 }).resolveName(value)
                        console.log(address, value)
                        if (address) {
                          setOwners({ ...owners, [index]: { address, ens: value } })
                          return
                        }
                      } catch (e) {
                        console.log(e)
                      }
                    }
                  }}
                  value={owners[index]?.ens || owners[index]?.address || ''}
                  isInvalid={(owners[index] && !ethers.utils.isAddress(owners[index].address)) || false}
                />
                {owners[index]?.ens && (
                  <InputRightElement>
                    <CheckIcon color="green.500" />
                  </InputRightElement>
                )}
              </InputGroup>
              {index !== 0 && (
                <DeleteIcon
                  onClick={() => {
                    let i = index
                    let newOwners = owners
                    while (i < ownerCount - 1) {
                      if (newOwners[i]) {
                        newOwners[i] = newOwners[i + 1]
                      }
                      i++
                    }
                    if (i === ownerCount - 1) {
                      delete newOwners[i]
                    }
                    setOwnerCount(ownerCount - 1)
                    setOwners(newOwners)
                  }}
                />
              )}
            </Flex>
          )
        })}
        <Button onClick={() => setOwnerCount(ownerCount + 1)}>Add owner</Button>
      </FormControl>
      <FormControl>
        <FormLabel>Signatures required</FormLabel>
        <NumberInput value={signaturesRequired} max={ownerCount} onChange={(value) => setSignaturesRequired(Number(value))}>
          <NumberInputField />
        </NumberInput>
      </FormControl>
      <FormControl>
        <FormLabel>Initial deposit in ETH</FormLabel>
        <NumberInput
          value={initialDeposit}
          onChange={(value) => {
            setInitialDeposit(Number(value))
          }}>
          <NumberInputField />
        </NumberInput>
      </FormControl>
      <FormControl isInvalid={!!error}>
        <Button
          isDisabled={!areOwnersValid() || name.length === 0}
          mt="2"
          onClick={() => {
            transactor(writeAsync?.(), (tx: any) => {
              console.log(tx)
              push(`/wallet/${predictedAddress}/${chain?.id}/transactions`)
            })
          }}>
          Create multisig
        </Button>
        <FormErrorMessage>{error?.message}</FormErrorMessage>
      </FormControl>
    </Flex>
  )
}
