'use client'
import { List, ListItem } from '@chakra-ui/react'
import { ethers } from 'ethers'
import { useMultiSigWallet } from 'providers/MultiSigWallet'

export default function Page() {
  const { address, nonce, name, signaturesRequired, ownerCount, isOwner, balance, creator, factory } = useMultiSigWallet()
  return (
    <>
      <List>
        <ListItem>{`Balance: ${balance && ethers.utils.formatEther(balance)}`}</ListItem>
        <ListItem>{`Nonce: ${nonce}`}</ListItem>
        <ListItem>{`Name: ${name}`}</ListItem>
        <ListItem>{`Signatures Required: ${signaturesRequired}`}</ListItem>
        <ListItem>{`Owner Count: ${ownerCount}`}</ListItem>
        {creator && <ListItem>{`Creator: ${creator}`}</ListItem>}
        {factory && <ListItem>{`Factory: ${factory}`}</ListItem>}
        <ListItem>{`Is Owner: ${isOwner}`}</ListItem>
      </List>
    </>
  )
}
