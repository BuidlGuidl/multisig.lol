export { createLegacySignClient, onApproveLegacyProposal, onRejectLegacyProposal } from './utils/LegacyWalletConnectUtil'
export { createSignClient, signClient, onApproveProposal, onRejectProposal } from './utils/WalletConnectUtil'
export { default as useWalletConnectEventsManager } from './hooks/useWalletConnectEventsManager'
export { default as WalletConnectProvider, useWalletConnectContext } from './WalletConnectProvider'
