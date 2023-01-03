import { Contract, Event as EthersEvent } from 'ethers'
import { useState, useEffect, useCallback } from 'react'
import { Address, useContractEvent, useProvider } from 'wagmi'

const useEventListener = (address: Address, abi: any, eventName: string) => {
  const [eventData, setEventData] = useState<EthersEvent[]>([])
  const provider = useProvider()

  const loadEvents = useCallback(async () => {
    const contract = new Contract(address, abi, provider)
    const filter = contract.filters[eventName]()
    const queryEvents = await contract.queryFilter(filter)
    setEventData(queryEvents)
  }, [address, abi, eventName, provider])

  useContractEvent({
    address,
    abi,
    eventName,
    listener(...args: [...args: unknown[], event: EthersEvent]) {
      const ethersEvent = args[args.length - 1] as EthersEvent
      setEventData((prev) => [...prev, ethersEvent])
    },
  })

  useEffect(() => {
    loadEvents()
  }, [address, abi, eventName, loadEvents])
  return eventData
}

export default useEventListener
