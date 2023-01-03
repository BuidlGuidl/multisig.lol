'use client'

import { WalletConnectModal } from 'components/WalletConnectModal'
import { WalletConnectProvider } from 'providers/WalletConnect'

export default function SafeLayout(props: any) {
  return (
    <WalletConnectProvider>
      {props.children}
      <WalletConnectModal></WalletConnectModal>
    </WalletConnectProvider>
  )
}
