import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

import { useLocalStorage, useStaticJsonRPC } from ".";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";

import { useEventListener } from "eth-hooks/events/";

import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import { Transactor, Web3ModalSetup } from "../helpers";

export default function useApp({
  targetNetwork,
  providers,
  injectedProvider,
  USE_BURNER_WALLET,
  address,
  deployedContracts,
  DEBUG,
  currentMultiSigAddress,
  contractNameForEvent,
  reDeployWallet,
  contractName,
}) {
  // // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const mainnetProvider = useStaticJsonRPC(providers);

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);

  const userSigner = userProviderAndSigner.signer;

  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // disabled externalContracts as it is taking old factory address or abi
  // const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };
  const contractConfig = { deployedContracts: deployedContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  const contractAddress = readContracts?.MultiSigWallet?.address;

  //📟 Listen for broadcast events
  // MultiSigFactory Events:
  // const ownersMultiSigEvents = useEventListener(readContracts, "MultiSigFactory", "Owners", localProvider, 1);
  // const walletCreateEvents = useEventListener(readContracts, "MultiSigFactory", "Create", localProvider, 1);
  const walletCreate2Events = useEventListener(readContracts, "MultiSigFactory", "Create2Event", localProvider, 1);
  // if (DEBUG) console.log("📟 ownersMultiSigEvents:", ownersMultiSigEvents);

  // MultiSigWallet Events:
  // const allExecuteTransactionEvents = useEventListener(
  //   currentMultiSigAddress && reDeployWallet === undefined ? readContracts : null,
  //   contractNameForEvent,
  //   "ExecuteTransaction",
  //   localProvider,
  //   1,
  // );
  // if (DEBUG) console.log("📟 executeTransactionEvents:", allExecuteTransactionEvents);

  // const allOwnerEvents = useEventListener(
  //   currentMultiSigAddress && reDeployWallet === undefined ? readContracts : null,
  //   contractNameForEvent,
  //   "Owner",
  //   localProvider,
  //   1,
  // );

  /**----------------------
   * readers hooks
   * ---------------------*/
  const signaturesRequiredContract = useContractReader(
    reDeployWallet === undefined ? readContracts : null,
    contractName,
    "signaturesRequired",
  );

  const nonceContract = useContractReader(reDeployWallet === undefined ? readContracts : null, contractName, "nonce");

  return {
    localProvider,
    mainnetProvider,
    price,
    gasPrice,
    userProviderAndSigner,
    userSigner,
    localChainId,
    selectedChainId,
    tx,
    yourLocalBalance,
    contractConfig,
    readContracts,
    writeContracts,
    mainnetContracts,
    contractAddress,
    // ownersMultiSigEvents,
    walletCreate2Events,
    // allExecuteTransactionEvents,
    // allOwnerEvents,
    signaturesRequiredContract,
    nonceContract,
  };
}
