'use client'

import { FC, useCallback, useState } from 'react'
import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import {
  onApproveLegacyProposal,
  onApproveProposal,
  onRejectLegacyProposal,
  onRejectProposal,
  useWalletConnectContext,
} from 'providers/WalletConnect'
import { useMultiSigWallet } from 'providers/MultiSigWallet'
import { rejectSessionRequest } from 'providers/WalletConnect/utils/WalletConnectUtil'
import { rejectLegacyRequest } from 'providers/WalletConnect/utils/LegacyWalletConnectUtil'
import { SignTransactionModal } from './SignTransactionModal'
import { SimpleTransaction } from 'types'

interface Props {}

export const WalletConnectModal: FC<Props> = () => {
  const [loading, setLoading] = useState(false)
  const { requests, legacySignClient, removeRequest, updatePairings } = useWalletConnectContext()
  const { address, chain } = useMultiSigWallet()
  const { push } = useRouter()
  const isOpen = requests.length > 0
  const activeProposal = requests[0]
  const onClose = useCallback(() => {
    if (!activeProposal) return
    if (activeProposal.type === 'legacyProposal' && legacySignClient) {
      onRejectLegacyProposal(legacySignClient)
    } else if (activeProposal.type === 'sessionProposal') {
      onRejectProposal(activeProposal.proposal)
    } else if (activeProposal.type === 'sessionRequest') {
      rejectSessionRequest(activeProposal)
    } else if (activeProposal.type === 'legacyRequest') {
      rejectLegacyRequest(activeProposal)
    }
    removeRequest()
    updatePairings()
  }, [activeProposal, legacySignClient, removeRequest, updatePairings])

  const onAccept = useCallback(async () => {
    if (!activeProposal) return
    setLoading(true)
    if (activeProposal.type === 'legacyProposal' && legacySignClient) {
      onApproveLegacyProposal(legacySignClient, activeProposal.proposal, [address])
    } else if (activeProposal.type === 'sessionProposal') {
      onApproveProposal(activeProposal.proposal, [address])
    }
    removeRequest()
    setLoading(false)
    updatePairings()
  }, [activeProposal, address, legacySignClient, removeRequest, updatePairings])

  const renderBody = () => {
    if (activeProposal.type === 'legacyProposal') {
      return (
        <div>
          <div>Id: {activeProposal.proposal.id}</div>
          <div>Name: {activeProposal.proposal.params[0].peerMeta.name}</div>
          <div>Description: {activeProposal.proposal.params[0].peerMeta.description}</div>
          <div>Url: {activeProposal.proposal.params[0].peerMeta.url}</div>
          <div>Chain: {activeProposal.proposal.params[0].chainId}</div>
        </div>
      )
    } else if (activeProposal.type === 'sessionProposal') {
      return (
        <div>
          <div>Id: {activeProposal.proposal.id}</div>
          <div>Name: {activeProposal.proposal.params.proposer.metadata.name}</div>
          <div>Description: {activeProposal.proposal.params.proposer.metadata.description}</div>
          <div>Url: {activeProposal.proposal.params.proposer.metadata.url}</div>
          <div>Chain: {JSON.stringify(activeProposal.proposal.params.requiredNamespaces.eip155.chains)}</div>
        </div>
      )
    } else if (activeProposal.type === 'sessionRequest') {
      return (
        <div>
          <div>Id: {activeProposal.requestEvent.id}</div>
          <div>Method: {activeProposal.requestEvent.params.request.method}</div>
          <div>Params: {JSON.stringify(activeProposal.requestEvent.params.request.params)}</div>
        </div>
      )
    } else if (activeProposal.type === 'legacyRequest') {
      return (
        <div>
          <div>Id: {activeProposal.legacyCallRequestEvent.id}</div>
          <div>Method: {activeProposal.legacyCallRequestEvent.method}</div>
          <div>Params: {JSON.stringify(activeProposal.legacyCallRequestEvent.params)}</div>
        </div>
      )
    } else {
      return null
    }
  }

  const modalType = () => {
    if (activeProposal.type === 'sessionRequest' && activeProposal.requestEvent.params.request.method === 'eth_sendTransaction')
      return 'eth_sendTransaction'
    if (activeProposal.type === 'legacyRequest' && activeProposal.legacyCallRequestEvent.method === 'eth_sendTransaction')
      return 'eth_sendTransaction'
    if (activeProposal.type === 'sessionProposal' || activeProposal.type === 'legacyProposal') return 'proposal'
    else return 'unsupported'
  }

  const invalidChain = () => {
    if (activeProposal.type === 'sessionRequest' && modalType() === 'eth_sendTransaction') {
      return activeProposal.requestEvent.params.request.params[0].chainId.toString() !== chain.toString()
    } else if (activeProposal.type === 'legacyRequest' && modalType() === 'eth_sendTransaction') {
      return activeProposal.legacyCallRequestEvent.params[0].chainId.toString() !== chain.toString()
    }
    return false
  }

  if (!activeProposal) return null

  if (modalType() === 'eth_sendTransaction' && !invalidChain()) {
    if (activeProposal.type === 'sessionRequest') {
      return (
        <SignTransactionModal
          isOpen={true}
          onClose={onClose}
          transaction={{
            to: activeProposal.requestEvent.params.request.params[0].to,
            value: activeProposal.requestEvent.params.request.params[0].value,
            data: activeProposal.requestEvent.params.request.params[0].data,
          }}
        />
      )
    } else if (activeProposal.type === 'legacyRequest') {
      return (
        <SignTransactionModal
          isOpen={true}
          onClose={onClose}
          transaction={{
            to: activeProposal.legacyCallRequestEvent.params[0].to,
            value: activeProposal.legacyCallRequestEvent.params[0].value,
            data: activeProposal.legacyCallRequestEvent.params[0].data,
          }}
        />
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{`${modalType() === 'unsupported' ? 'Unsupported ' : ''}${activeProposal.type}${
          invalidChain() ? ': invalid chain' : ''
        }`}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{renderBody()}</ModalBody>

        <ModalFooter>
          {modalType() !== 'unsupported' && !invalidChain() && (
            <Button
              onClick={async () => {
                onAccept()
              }}
              isLoading={loading}>
              Accept
            </Button>
          )}
          <Button variant="ghost" colorScheme="blue" mr={3} onClick={onClose}>
            Reject
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
