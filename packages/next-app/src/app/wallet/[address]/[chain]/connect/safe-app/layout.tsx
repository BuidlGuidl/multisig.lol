'use client'

import { SafeInjectProvider } from 'providers/Safe'

export default function SafeLayout(props: any) {
  return <SafeInjectProvider>{props.children}</SafeInjectProvider>
}
