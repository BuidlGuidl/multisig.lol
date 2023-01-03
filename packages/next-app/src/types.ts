import { BigNumberish } from 'ethers'
import { Address } from 'wagmi'

export type MultiSig = {
  name: string
  creator: Address | null
  factory: Address
  address: Address
  deployments: MultiSigDeployments
}

interface MultiSigDeployments {
  [key: number]: string
}

export type MultiSigDeployment = {
  chain: number
  address: Address
  transactions: PoolTransactions
}

export type TransactionSignature = {
  signer: Address
  signature: string
}

export interface TransactionSignatures {
  [key: Address]: TransactionSignature
}

export interface PoolTransactions {
  [key: string]: PoolTransaction
}

export type SimpleTransaction = {
  to: Address
  data: string
  value: BigNumberish
}

export interface BaseTransaction extends SimpleTransaction {
  nonce: number
  chainId: number
}

export interface PoolTransaction extends BaseTransaction {
  signatures: TransactionSignatures
}
