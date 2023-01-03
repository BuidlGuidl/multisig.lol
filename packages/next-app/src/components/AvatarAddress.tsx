import { useEffect } from 'react'
import { Flex, Text, useClipboard } from '@chakra-ui/react'
import { Avatar } from 'connectkit'
import { Address } from 'wagmi'
import { CopyIcon } from '@chakra-ui/icons'
import { useToast } from '@chakra-ui/react'
import { Blockie } from './Blockie'

const sizeLookup = {
  '6xl': 56,
  '5xl': 48,
  '4xl': 42,
  '3xl': 36,
  '2xl': 32,
  xl: 28,
  lg: 24,
  md: 20,
  sm: 14,
  xs: 10,
}

interface Props {
  address: Address
  size?: keyof typeof sizeLookup
  copyable?: boolean
  gradient?: boolean
}

export function AvatarAddress(props: Props) {
  const { onCopy, setValue } = useClipboard('')
  const abbreviatedAddress = `${props.address.substring(0, 4)}...${props.address.substring(props.address.length - 5)}`
  const size = props.size || 'md'
  const iconSize = sizeLookup[size] / 4
  const toast = useToast()

  useEffect(() => {
    setValue(props.address)
  }, [props.address, setValue])

  return (
    <Flex alignItems="center" gap={1} margin={1}>
      {props.gradient ? <Avatar name={props.address} size={sizeLookup[size]} /> : <Blockie address={props.address} size={8} scale={3} />}
      <Text fontSize={size}>{abbreviatedAddress}</Text>
      {props.copyable && (
        <CopyIcon
          boxSize={iconSize}
          onClick={() => {
            onCopy()
            toast({
              title: 'Copied',
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top-right',
            })
          }}
        />
      )}
    </Flex>
  )
}
