'use client'

import OwnersOnlyWrapper from 'components/OwnersOnly'

export default function ActionLayout(props: any) {
  return <OwnersOnlyWrapper>{props.children}</OwnersOnlyWrapper>
}
