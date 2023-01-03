'use client'
import { ColorModeScript } from '@chakra-ui/react'
import { THEME_INITIAL_COLOR } from 'utils/config'

import type { AppProps } from 'next/app'
import { Layout } from 'components/layout'
import { Web3Provider } from 'providers/Web3'
import { ChakraProvider } from 'providers/Chakra'
import { useIsMounted } from 'hooks/useIsMounted'
import ConnectWalletWrapper from 'components/ConnectWallet'

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {
  const isMounted = useIsMounted()
  return (
    <html lang="en">
      <body>
        <ChakraProvider>
          <Web3Provider>
            {isMounted && (
              <Layout>
                <ConnectWalletWrapper>
                  <ColorModeScript initialColorMode={THEME_INITIAL_COLOR} />
                  {children}
                </ConnectWalletWrapper>
              </Layout>
            )}
          </Web3Provider>
        </ChakraProvider>
      </body>
    </html>
  )
}
