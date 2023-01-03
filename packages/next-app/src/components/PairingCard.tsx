import { truncate } from 'utils/helpers'
import { Avatar, Button, Card, Link, Text, Flex } from '@chakra-ui/react'
import Image from 'next/image'

/**
 * Types
 */
interface IProps {
  logo?: string
  name?: string
  url?: string
  onDelete: () => Promise<void>
}

/**
 * Component
 */
export default function PairingCard({ logo, name, url, onDelete }: IProps) {
  return (
    <Card w={'md'}>
      <Avatar src={logo} />
      <Flex gap="2">
        <Text>{name}</Text>
        <Link href={url}>{truncate(url?.split('https://')[1] ?? 'Unknown', 23)}</Link>
      </Flex>
      <Button size="sm" color="error" onClick={onDelete} css={{ minWidth: 'auto' }}>
        Delete pairing
      </Button>
    </Card>
  )
}
