import React from 'react'
import Blockies from 'react-blockies'
import { Address } from 'wagmi'

interface Props {
  address: Address
  size?: number | undefined
  scale?: number | undefined
}

export function Blockie(props: Props) {
  return <Blockies seed={props.address.toLowerCase()} size={props.size || 8} scale={props.scale || 4} />
}
