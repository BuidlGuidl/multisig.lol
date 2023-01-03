import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
import { ethers, utils } from 'ethers'
import { useAppCommunicator } from './useAppCommunicator'
import { Methods, MethodToResponse, RPCPayload, Transaction } from './types'
import { useNetwork, useProvider, useSigner } from 'wagmi'
import { useMultiSigWallet } from 'providers/MultiSigWallet'

interface TransactionWithId extends Transaction {
  id: number
}

type SafeInjectContextType = {
  iframeRef: React.RefObject<HTMLIFrameElement> | null
  newTx: TransactionWithId | undefined
  setNewTx: React.Dispatch<React.SetStateAction<any>>
}

export const SafeInjectContext = createContext<SafeInjectContextType>({
  iframeRef: null,
  newTx: undefined,
  setNewTx: () => {},
})

export const SafeInjectProvider: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useMultiSigWallet()
  const ethersProvider = useProvider()
  const [newTx, setNewTx] = useState<TransactionWithId>()
  const { chain } = useNetwork()

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const communicator = useAppCommunicator(iframeRef)

  const provider = useMemo(() => {
    if (chain?.rpcUrls.alchemy) {
      return new ethers.providers.StaticJsonRpcProvider(`${chain?.rpcUrls.alchemy.http[0]}/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
    } else if (chain) {
      return new ethers.providers.StaticJsonRpcProvider(chain?.rpcUrls.default.http[0])
    }
    return null
  }, [chain])

  useEffect(() => {
    if (!provider) return

    communicator?.on(Methods.getSafeInfo, () => {
      console.log('getSafeInfo')
      return {
        safeAddress: address,
        chainId: chain?.id,
        owners: [],
        threshold: 1,
        isReadOnly: false,
      }
    })

    communicator?.on(Methods.getEnvironmentInfo, async () => ({
      origin: document.location.origin,
    }))

    communicator?.on(Methods.rpcCall, async (msg) => {
      const params = msg.data.params as RPCPayload
      try {
        const response = (await provider.send(params.call, params.params)) as MethodToResponse['rpcCall']
        return response
      } catch (err) {
        return err
      }
    })

    communicator?.on(Methods.sendTransactions, (msg) => {
      // @ts-expect-error explore ways to fix this
      const transactions = (msg.data.params.txs as Transaction[]).map(({ to, ...rest }) => ({
        to: utils.getAddress(to), // checksummed
        ...rest,
      }))
      setNewTx({
        id: parseInt(msg.data.id.toString()),
        ...transactions[0],
      })
      // openConfirmationModal(transactions, msg.data.params.params, msg.data.id)
    })

    communicator?.on(Methods.signMessage, async (msg) => {
      // openSignMessageModal(message, msg.data.id, Methods.signMessage)
    })

    communicator?.on(Methods.signTypedMessage, async (msg) => {
      // openSignMessageModal(typedData, msg.data.id, Methods.signTypedMessage)
    })
  }, [communicator, address, provider, chain?.id])

  return (
    <SafeInjectContext.Provider
      value={{
        iframeRef,
        newTx,
        setNewTx,
      }}>
      {children}
    </SafeInjectContext.Provider>
  )
}

export const useSafeInject = () => useContext(SafeInjectContext)
