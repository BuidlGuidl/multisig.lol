'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, Flex } from '@chakra-ui/react'

export default function Page(props: any) {
  const pathName = usePathname()
  return (
    <Flex gap="2" m="2">
      <Button>
        <Link href={`${pathName}/safe-app`}>Safe app</Link>
      </Button>

      <Button>
        <Link href={`${pathName}/walletconnect`}>Walletconnect</Link>
      </Button>
    </Flex>
  )
}
