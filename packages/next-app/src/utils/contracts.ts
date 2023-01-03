import { BigNumber, Bytes, Contract } from 'ethers'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { BaseTransaction, TransactionSignatures } from 'types'
import { Address, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { provider } from './provider'

type Deployments = {
  [key: number]: string
}

export const FACTORY_DEPLOYMENTS: Deployments = {
  1: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
  5: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
  10: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
  100: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
  137: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
  42161: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
  80001: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
  11155111: '0x8b50c76eAf0Db1B7dE1f7bA456351E98cFd8bd9f',
}

export const FACTORY_ABI = [
  {
    inputs: [],
    name: 'CALLER_NOT_REGISTERED',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contractId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'contractAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'owners',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'signaturesRequired',
        type: 'uint256',
      },
    ],
    name: 'Create2Event',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'contractAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'owners',
        type: 'address[]',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'signaturesRequired',
        type: 'uint256',
      },
    ],
    name: 'Owners',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
    ],
    name: 'computedAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_owners',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: '_signaturesRequired',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
    ],
    name: 'create2',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_contractAddress',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: '_owners',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: '_signaturesRequired',
        type: 'uint256',
      },
    ],
    name: 'emitOwners',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_index',
        type: 'uint256',
      },
    ],
    name: 'getMultiSig',
    outputs: [
      {
        internalType: 'address',
        name: 'multiSigAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'signaturesRequired',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'multiSigs',
    outputs: [
      {
        internalType: 'contract MultiSigWallet',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'numberOfMultiSigs',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const MULTISIG_ABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
      {
        internalType: 'address',
        name: '_factory',
        type: 'address',
      },
    ],
    stateMutability: 'payable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'DUPLICATE_OR_UNORDERED_SIGNATURES',
    type: 'error',
  },
  {
    inputs: [],
    name: 'INSUFFICIENT_VALID_SIGNATURES',
    type: 'error',
  },
  {
    inputs: [],
    name: 'INVALID_OWNER',
    type: 'error',
  },
  {
    inputs: [],
    name: 'INVALID_SIGNATURES_REQUIRED',
    type: 'error',
  },
  {
    inputs: [],
    name: 'INVALID_SIGNER',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NOT_ENOUGH_SIGNERS',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NOT_FACTORY',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NOT_OWNER',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NOT_SELF',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TX_FAILED',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256',
      },
    ],
    name: 'Deposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address payable',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'hash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'result',
        type: 'bytes',
      },
    ],
    name: 'ExecuteTransaction',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'added',
        type: 'bool',
      },
    ],
    name: 'Owner',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newSigner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'newSignaturesRequired',
        type: 'uint256',
      },
    ],
    name: 'addSigner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'chainId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'to',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'value',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes[][]',
        name: 'signatures',
        type: 'bytes[][]',
      },
    ],
    name: 'executeBatch',
    outputs: [
      {
        internalType: 'bytes[]',
        name: '',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: 'signatures',
        type: 'bytes[]',
      },
    ],
    name: 'executeTransaction',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factoryVersion',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_nonce',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'getTransactionHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_owners',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: '_signaturesRequired',
        type: 'uint256',
      },
    ],
    name: 'init',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'isOwner',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nonce',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'numberOfOwners',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'owners',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_hash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
    ],
    name: 'recover',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'oldSigner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'newSignaturesRequired',
        type: 'uint256',
      },
    ],
    name: 'removeSigner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'signaturesRequired',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newSignaturesRequired',
        type: 'uint256',
      },
    ],
    name: 'updateSignaturesRequired',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const

export const walletContract = (address: Address, chainId: number) => {
  const contract = new Contract(address, MULTISIG_ABI, provider({ chainId }))
  return contract
}

export const factoryContract = (address: Address, chainId: number) => {
  const contract = new Contract(address, FACTORY_ABI, provider({ chainId }))
  return contract
}
