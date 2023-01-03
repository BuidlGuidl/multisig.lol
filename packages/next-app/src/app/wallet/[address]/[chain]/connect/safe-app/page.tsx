'use client'
import { Button, Input } from '@chakra-ui/react'

import { SignTransactionModal } from 'components/SignTransactionModal'
import { useSearchParams } from 'next/navigation'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { useSafeInject } from 'providers/Safe'
import { useState } from 'react'

export default function Page(props: any) {
  const { iframeRef, newTx, setNewTx } = useSafeInject()
  const [refresh, setRefresh] = useState(1)
  const [isIFrameLoading, setIsIFrameLoading] = useState(true)
  const { nonce } = useMultiSigWallet()

  const searchParams = useSearchParams()
  const fixedUrl = searchParams.get('url')
  const [url, setUrl] = useState<string | undefined>(fixedUrl || undefined)

  return (
    <>
      <Input
        placeholder="enter url"
        onChange={(e) => {
          setUrl(e.target.value)
        }}
        value={url}
        disabled={!!fixedUrl}
      />
      <Button
        onClick={() => {
          setRefresh(refresh + 1)
          setIsIFrameLoading(true)
        }}>
        refresh
      </Button>
      <iframe
        key={refresh}
        title="app"
        src={url}
        width="100%"
        height="500rem"
        style={{
          marginTop: '1rem',
        }}
        ref={iframeRef}
        onLoad={() => setIsIFrameLoading(false)}
      />
      {newTx && nonce && (
        <SignTransactionModal
          transaction={{
            to: newTx?.to as `0x${string}`,
            value: newTx?.value,
            data: newTx?.data,
          }}
          isOpen={!!newTx}
          onClose={() => setNewTx(undefined)}
        />
      )}
    </>
  )
}
