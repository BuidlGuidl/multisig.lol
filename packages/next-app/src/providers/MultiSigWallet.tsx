import { BigNumber, ethers } from 'ethers'
import React, { FC, useContext, useEffect, useMemo, useState } from 'react'
import { MULTISIG_ABI, walletContract } from 'utils/contracts'
import {
  Address,
  paginatedIndexesConfig,
  useAccount,
  useBalance,
  useContractInfiniteReads,
  useContractRead,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
} from 'wagmi'
import useSWR from 'swr'
import { BaseTransaction, PoolTransaction, TransactionSignature, TransactionSignatures, SimpleTransaction } from 'types'

interface WalletQuery {
  address: Address
  chain: number
  nonce?: ethers.BigNumber
  name?: string
  ownerCount?: ethers.BigNumber
  signaturesRequired?: ethers.BigNumber
  isOwner?: boolean
  balance?: ethers.BigNumber
  owners: Address[]
  creator?: Address
  factory?: Address
  transactions?: [string, PoolTransaction][]
  signTransactionAndSave: (transaction: BaseTransaction) => Promise<void>
  refetchTransactions: () => void
  error: Error | null
  refetchOnChain: () => void
}

interface Props {
  address: Address
  children?: React.ReactNode
  chain: number
}

export const MultiSigWallet = React.createContext<WalletQuery>({} as WalletQuery)

export const useMultiSigWallet = () => {
  const walletContext = useContext(MultiSigWallet)

  if (walletContext === undefined) {
    throw new Error('useMultiSigWallet must be used within a MultiSigWallet.Provider')
  }

  return walletContext
}

export const MultiSigWalletProvider: FC<Props> = ({ children, address, chain }) => {
  const { address: userAddress } = useAccount()
  const { data: signer } = useSigner()

  const {
    data,
    error,
    refetch: refetchOnChain,
  } = useContractReads({
    contracts: [
      {
        address: address,
        abi: MULTISIG_ABI,
        functionName: 'nonce',
      },
      {
        address: address,
        abi: MULTISIG_ABI,
        functionName: 'name',
      },
      {
        address: address,
        abi: MULTISIG_ABI,
        functionName: 'numberOfOwners',
      },
      {
        address: address,
        abi: MULTISIG_ABI,
        functionName: 'signaturesRequired',
      },
    ],
  })

  const [nonce, name, ownerCount, signaturesRequired] = data
    ? (data as [BigNumber, string, BigNumber, BigNumber])
    : [undefined, undefined, undefined, undefined]

  const { data: balance } = useBalance({
    address,
  })

  const validMultisig = signaturesRequired && name

  const fetcher = (url: string) => fetch(url).then((res) => res.json())
  const { data: metadata } = useSWR(() => (validMultisig ? `/api/wallet/${address}/metadata` : null), fetcher)
  const { data: transactions, mutate: refetchTransactions } = useSWR(
    () => (validMultisig ? `/api/wallet/${address}/transactions/${chain}` : null),
    fetcher
  )

  const multiSigContractConfig = {
    address,
    abi: MULTISIG_ABI,
  }

  const { data: ownerPages } = useContractInfiniteReads({
    cacheKey: 'multiSigOwners',
    enabled: !!ownerCount,
    ...paginatedIndexesConfig(
      (index) => {
        return [
          {
            ...multiSigContractConfig,
            functionName: 'owners',
            args: [BigNumber.from(index)] as const,
          },
        ]
      },
      { start: 0, perPage: ownerCount?.toNumber() || 1, direction: 'increment' }
    ),
  })

  const owners = (ownerPages ? ownerPages.pages[0] : []) as Address[]

  const signTransactionAndSave = async (tx: BaseTransaction) => {
    if (!signer) {
      throw new Error('No signer found')
    }

    const calculatedHash = calculateHash(tx, address)
    const signature = await signer.signMessage(ethers.utils.arrayify(calculatedHash))
    const recoveredSigner = ethers.utils.recoverAddress(ethers.utils.hashMessage(ethers.utils.arrayify(calculatedHash)), signature)

    if (recoveredSigner !== userAddress) {
      throw new Error('Recovered signer does not match user address')
    }

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: calculatedHash,
        nonce: tx.nonce,
        to: tx.to,
        data: tx.data,
        value: tx.value,
        chain: tx.chainId,
        signature: signature,
        signer: userAddress,
      }),
    }
    const result = await fetch(`/api/wallet/${address}/sign`, requestOptions)
    console.log(result)
  }

  return (
    <MultiSigWallet.Provider
      value={{
        address,
        name,
        nonce,
        ownerCount,
        isOwner: userAddress ? owners.includes(userAddress) : false,
        signaturesRequired,
        balance: balance?.value,
        owners,
        creator: metadata?.creator || undefined,
        factory: metadata?.factory || undefined,
        transactions,
        signTransactionAndSave,
        chain,
        refetchTransactions,
        error,
        refetchOnChain,
      }}>
      {children}
    </MultiSigWallet.Provider>
  )
}

const calculateHash = (tx: PoolTransaction | BaseTransaction, address: Address) => {
  return ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'uint256', 'address', 'uint256', 'bytes'],
    [address, tx.chainId, tx.nonce, tx.to, tx.value, tx.data]
  )
}

const sortSignatures = (signatures: TransactionSignatures) => {
  const signatureArray = Object.values(signatures) as TransactionSignature[]
  const sortedSignatures = signatureArray.sort((a, b) => {
    return ethers.BigNumber.from(a.signer).gt(ethers.BigNumber.from(b.signer)) ? 1 : -1
  })
  return sortedSignatures
}

const prepareSignatures = (transaction: PoolTransaction, address: Address, owners: Address[]) => {
  const sortedSignatures = sortSignatures(transaction.signatures)
  const calculatedHash = calculateHash(transaction, address)
  const signatures = sortedSignatures
    .map((s) => {
      const recoveredSigner = ethers.utils.recoverAddress(ethers.utils.hashMessage(ethers.utils.arrayify(calculatedHash)), s.signature)
      return recoveredSigner === s.signer && owners.includes(s.signer) ? s.signature : null
    })
    .filter((s) => typeof s === 'string') as `0x${string}`[]
  return signatures
}

const usePrepareSignatures = (transaction: PoolTransaction) => {
  const { address, owners, signaturesRequired } = useMultiSigWallet()
  const signatures = useMemo(() => {
    return prepareSignatures(transaction, address, owners)
  }, [transaction, address, owners])

  return { signatures }
}

const useBatchPrepareSignatures = (transactions: PoolTransaction[]) => {
  const { address, owners, signaturesRequired } = useMultiSigWallet()
  const signatures = useMemo(() => {
    return transactions.map((t) => prepareSignatures(t, address, owners))
  }, [transactions, address, owners])

  return { signatures }
}

export const useExecuteTransaction = (transaction: PoolTransaction, enabled: boolean) => {
  const { address, signaturesRequired } = useMultiSigWallet()
  const { signatures } = usePrepareSignatures(transaction)
  const { config, error } = usePrepareContractWrite({
    address,
    abi: MULTISIG_ABI,
    functionName: 'executeTransaction',
    args: [transaction.to, transaction.value as BigNumber, transaction.data as `0x${string}`, signatures.slice(0, signaturesRequired?.toNumber())],
    enabled,
  })
  const { writeAsync } = useContractWrite(config)
  const hasRequiredSignatures = signaturesRequired && signatures.length >= signaturesRequired?.toNumber()
  return { writeAsync, error, hasRequiredSignatures }
}

export const useExecuteBatch = (transactions: PoolTransaction[], enabled: boolean) => {
  const { address, signaturesRequired } = useMultiSigWallet()
  const { signatures } = useBatchPrepareSignatures(transactions)
  const { config, error } = usePrepareContractWrite({
    address,
    abi: MULTISIG_ABI,
    functionName: 'executeBatch',
    args: [
      transactions.map((t) => t.to),
      transactions.map((t) => t.value as BigNumber),
      transactions.map((t) => t.data as `0x${string}`),
      signatures,
    ],
    enabled,
  })
  const { writeAsync } = useContractWrite(config)
  const hasRequiredSignatures = signaturesRequired && signatures.map((s) => s.length >= signaturesRequired?.toNumber())
  return { writeAsync, error, hasRequiredSignatures }
}

export const decodeMultiSigTransaction = (transaction: SimpleTransaction) => {
  const contractInterface = new ethers.utils.Interface(MULTISIG_ABI)
  const parsedTransaction = contractInterface.parseTransaction({ data: transaction.data, value: transaction.value })
  return parsedTransaction
}

export default MultiSigWalletProvider
