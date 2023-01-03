import Notify from 'bnc-notify'
import { useCallback, useState } from 'react'

import { useSigner } from 'wagmi'

import { getErrorMessage } from 'utils/errors'
import { useToast } from '@chakra-ui/react'

const useTransactor = () => {
  const { data: signer } = useSigner()
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const transactor = useCallback(
    async (tx: Promise<any> | undefined, cb?: Function, confirmations: number = 1) => {
      setLoading(true)

      if (!signer) {
        throw new Error('No signer provided for this transaction')
      }

      if (!tx) {
        throw new Error('Transaction is not valid')
      }

      try {
        const transaction = await tx
        const network = await signer.provider?.getNetwork()
        const notify = Notify({
          dappId: process.env.NEXT_PUBLIC_BLOCKNATIVE_API_KEY, // [String] The API key created by step one above
          networkId: network?.chainId, // [Integer] The Ethereum network ID your Dapp uses.
        })

        notify.hash(transaction.hash)

        await transaction.wait(confirmations)

        if (cb) cb(transaction.hash)
        setLoading(false)
      } catch (e) {
        const message = getErrorMessage(e)

        toast({ title: 'Error', description: message, status: 'error', duration: 5000, isClosable: true, position: 'top-right' })
        // eslint-disable-next-line no-console
        console.log(e)
        setLoading(false)
      }
    },
    [signer, toast]
  )

  return { loading, transactor }
}

export default useTransactor
