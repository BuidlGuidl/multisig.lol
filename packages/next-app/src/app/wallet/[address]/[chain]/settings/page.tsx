'use client'
import { Button, Flex, Heading, List, ListItem } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMultiSigWallet } from 'providers/MultiSigWallet'

export default function Page(props: any) {
  const { owners, signaturesRequired } = useMultiSigWallet()
  const pathName = usePathname()
  return (
    <>
      <Heading size="md" mt="2">
        Owners
      </Heading>
      <List>
        {owners.map((owner, index) => (
          <ListItem key={index}>{owner}</ListItem>
        ))}
      </List>
      <Heading size="md" mt="2">
        {`Signatures required: ${signaturesRequired}`}
      </Heading>
      <Flex gap="2" mt="2">
        <Link href={`${pathName}/add-signer`}>
          <Button>Add signer</Button>
        </Link>

        <Link href={`${pathName}/remove-signer`}>
          <Button>Remove signer</Button>
        </Link>

        <Link href={`${pathName}/set-threshold`}>
          <Button>Set threshold</Button>
        </Link>
      </Flex>
    </>
  )
}
