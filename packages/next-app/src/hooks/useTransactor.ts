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
        toast({ title: 'Transaction submitted', status: 'loading', isClosable: true, position: 'top-right' })

        await transaction.wait(confirmations)

        toast({ title: 'Transaction confirmed', status: 'success', isClosable: true, position: 'top-right' })

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
