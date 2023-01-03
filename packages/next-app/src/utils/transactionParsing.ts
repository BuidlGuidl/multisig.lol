import { ethers } from 'ethers'
import { BaseTransaction } from 'types'
import { Address } from 'wagmi'
import { Abi } from 'abitype/zod'

function isJsonString(str: string) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

export default async function parseExternalContractTransaction(tx: BaseTransaction) {
  try {
    console.log(process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY, tx.to)
    const paramsObject = {
      module: 'contract',
      action: 'getabi',
      address: tx.to as string,
      apikey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY as string,
    }
    const response = await fetch('https://api.etherscan.io/api?' + new URLSearchParams(paramsObject))

    const abi = await response.json()
    console.log(abi)
    const parsedAbi = Abi.parse(abi)
    const iface = new ethers.utils.Interface(JSON.stringify(parsedAbi))
    return iface.parseTransaction({ data: tx.data, value: tx.value })

    // response = await fetch(`/api/v1/signatures/?hex_signature=${tx.data.slice(0, 10)}`)
  } catch (error) {
    console.log('parseExternalContractTransaction error:', error)
    return null
  }
}
