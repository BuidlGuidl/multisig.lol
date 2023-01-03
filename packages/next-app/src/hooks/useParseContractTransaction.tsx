import { ethers } from 'ethers'
import { SimpleTransaction } from 'types'
import { Abi } from 'abitype/zod'
import useSWRImmutable from 'swr/immutable'
import { EthChainId, ETHERSCAN_API_URLS } from 'utils/config'

function isJsonString(str: string) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

export default function useParseContractTransaction(tx: SimpleTransaction, chain: EthChainId) {
  const fetcher = (url: string) => fetch(url).then((res) => res.json())

  const paramsObject = {
    module: 'contract',
    action: 'getabi',
    address: tx.to as string,
    apikey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY as string,
  }
  const { data, error } = useSWRImmutable(ETHERSCAN_API_URLS[chain] + '?' + new URLSearchParams(paramsObject), fetcher)
  try {
    if (data) {
      const abi = data?.result
      const parsedAbi = Abi.parse(JSON.parse(abi))
      const iface = new ethers.utils.Interface(JSON.stringify(parsedAbi))
      const parsedTransaction = iface.parseTransaction({ data: tx.data, value: tx.value })
      return { parsedTransaction, error }
    }
    return { error }
  } catch (e) {
    console.log(e)
    return { error }
  }
}
