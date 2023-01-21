import { Button, Col, Row } from "antd";

import { useHistory } from "react-router-dom";

import { useContractReader } from "eth-hooks";

import { Faucet, GasGauge, Ramp } from "./components";
import AppLayout from "./components/AppLayout";
import NetworkDisplay from "./components/NetworkDisplay";
import useLocalStorage from "./hooks/useLocalStorage";
import StoreProvider from "./store/StoreProvider";
import { CreateWallet, Home, NewTranscaction, Transcations, SafeApps, Manage } from "./views";
import { SafeInjectProvider } from "./store/SafeInjectProvider";

import "antd/dist/antd.css";

import {
  useBalance,
  useContractLoader,
  useGasPrice,
  // useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { ethers } from "ethers";
import React, { useCallback, useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";

import "./App.css";
import { Account, MainHeader, NetworkSwitch, SafeApp, ThemeSwitch } from "./components";
import { ALCHEMY_KEY, NETWORKS } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import MultiSigWalletAbi from "./configs/MultiSigWallet_ABI.json";
import _deployedContracts from "./contracts/deployed_contracts.json";
import hardhatContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup, getRPCPollTime } from "./helpers";
import { useStaticJsonRPC } from "./hooks";
// import SafeApps from "./views/SafeApps";
// import Manage from "./views/Manage";

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, goerli, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = true;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

let deployedContracts = {
  ..._deployedContracts,
  ...hardhatContracts,
};

console.log("deployedContracts", deployedContracts);

const WALLET_CONTRACT_ADDRESS = "0x924E029aa245AbADC5Ebd379457eAa48Cf0E4422";
// const WALLET_CONTRACT_ADDRESS = "0xb3E2A650c9032A40168148e5b1bdb69E68A461D8";

const multiSigWalletABI = MultiSigWalletAbi["abi"];
const walletContractName = "MultiSigWallet";
const factoryContractName = "MultiSigFactory";

function App(props) {
  const history = useHistory();
  const networkOptions = [initialNetwork.name, "mainnet", "goerli"];

  // const targetNetwork = NETWORKS[selectedNetwork];

  const cachedNetwork = window.localStorage.getItem("network");
  let targetNetwork = NETWORKS[cachedNetwork || "mainnet"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState(undefined);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [isWalletLoaded, setIsWalletLoaded] = useState(false);
  const [signaturesRequired, setSignaturesRequired] = useState(false);
  const [userWallets, setUserWallets] = useState([]);

  const [mainWalletConnectSession, setMainWalletConnectSession] = useLocalStorage("walletConnectSession_main");
  const [importedWalletList, setImportedWalletList] = useLocalStorage("importedWalletList", []);
  const [hiddenWalletList, setHiddenWalletList] = useLocalStorage("hiddenWalletList", []);

  // a local storage to persist selected wallet data
  const [walletData, setWalletData] = useLocalStorage("_walletData", {
    [targetNetwork.chainId]: {
      selectedWalletAddress: undefined,
      selectedWalletName: undefined,
    },
  });

  // backend transaction handler:
  let BACKEND_URL = "http://localhost:49899";
  if (targetNetwork && targetNetwork.name && targetNetwork.name !== "localhost") {
    // BACKEND_URL = "https://backend.multisig.lol:49899";
    BACKEND_URL = "https://gorgeous-leather-jacket-crow.cyclic.app"; // cyclic.sh backend
  }

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const mainnetProvider = useStaticJsonRPC(providers, localProvider);

  // Sensible pollTimes depending on the provider you are using
  const localProviderPollingTime = getRPCPollTime(localProvider);
  const mainnetProviderPollingTime = getRPCPollTime(mainnetProvider);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider, mainnetProviderPollingTime);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast", localProviderPollingTime);
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address, localProviderPollingTime);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address, mainnetProviderPollingTime);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  const nonce = useContractReader(readContracts, walletContractName, "nonce");
  // console.log(`n-🔴 => App => nonce`, nonce?.toString());
  // const signaturesRequired = useContractReader(readContracts, walletContractName, "signaturesRequired");

  const loadWeb3Modal = useCallback(async () => {
    //const provider = await web3Modal.connect();
    const provider = await web3Modal.requestProvider();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  const loadWalletContract = async () => {
    readContracts.MultiSigWallet = new ethers.Contract(selectedWalletAddress, multiSigWalletABI, localProvider);
    writeContracts.MultiSigWallet = new ethers.Contract(selectedWalletAddress, multiSigWalletABI, userSigner);
    setIsWalletLoaded(true);
    let sigRequired = await readContracts.MultiSigWallet.signaturesRequired();
    // console.log(`n-🔴 => loadWalletContract => sigRequired`, sigRequired);
    setSignaturesRequired(sigRequired);
  };

  const onChangeWallet = (walletAddress, walletName) => {
    setSelectedWalletAddress(walletAddress);

    setWalletData({
      ...walletData,
      [targetNetwork.chainId]: {
        selectedWalletAddress: walletAddress,
        selectedWalletName: walletName,
      },
    });
    history.push("/");
  };
  const onChangeNetwork = async value => {
    if (targetNetwork.chainId !== NETWORKS[value].chainId) {
      // window.localStorage.setItem("network", value);
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1);
      let targetNetwork = NETWORKS[value];

      const ethereum = window.ethereum;
      const data = [
        {
          chainId: "0x" + targetNetwork.chainId.toString(16),
          chainName: targetNetwork.name,
          nativeCurrency: targetNetwork.nativeCurrency,
          rpcUrls: [targetNetwork.rpcUrl],
          blockExplorerUrls: [targetNetwork.blockExplorer],
        },
      ];
      console.log("data", data);

      let switchTx;
      // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
      try {
        switchTx = await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: data[0].chainId }],
        });
      } catch (switchError) {
        // not checking specific error code, because maybe we're not using MetaMask
        try {
          switchTx = await ethereum.request({
            method: "wallet_addEthereumChain",
            params: data,
          });
        } catch (addError) {
          // handle "add" error
        }
      }

      window.localStorage.setItem("network", value);
      // setTimeout(() => {
      // window.location.reload();
      // }, 1);

      if (switchTx) {
      }
    }
  };

  /**
   useEffects
  */
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
  ]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
    //automatically connect if it is a safe app
    const checkSafeApp = async () => {
      if (await web3Modal.isSafeApp()) {
        loadWeb3Modal();
      }
    };
    checkSafeApp();
  }, [loadWeb3Modal]);

  useEffect(() => {
    if ("MultiSigFactory" in readContracts && "MultiSigFactory" in writeContracts && selectedWalletAddress) {
      loadWalletContract();
    }
  }, [readContracts, writeContracts, selectedWalletAddress]);

  // -----------------
  //   page reload on metamask account and network change
  // -----------------
  useEffect(() => {
    window.ethereum?.on("accountsChanged", function () {
      window.location.reload();
    });
    // detect Network account change
    window.ethereum?.on("networkChanged", function () {
      if (deployedContracts[targetNetwork.chainId] === undefined) {
        console.log("NO FACTORY FOUND LOGING OUT !!!");
        logoutOfWeb3Modal();
      } else {
        window.location.reload();
      }
    });

    if (mainWalletConnectSession !== undefined) {
      localStorage.setItem("walletconnect", JSON.stringify(mainWalletConnectSession));
    }
  }, []);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  // TODO: REFACTORE IN ANOTHER FILE
  // top header bar
  const HeaderBar = (
    <>
      <MainHeader>
        <div className="relative flex items-center justify-center" key={address}>
          {USE_NETWORK_SELECTOR && (
            <div className="">
              {/* <NetworkSwitch
                networkOptions={networkOptions}
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
              /> */}
              <NetworkSwitch selectedNetwork={targetNetwork.name} onChangeNetwork={onChangeNetwork} />
            </div>
          )}

          <div>
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
              gasPrice={gasPrice}
            />
          </div>
        </div>
      </MainHeader>

      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />
    </>
  );

  // GLOBAL STATES
  const store = {
    nonce,
    signaturesRequired,
    selectedWalletAddress,
    address,
    BACKEND_URL,
    readContracts,
    writeContracts,
    localProvider,
    userSigner,
    price,
    mainnetProvider,
    blockExplorer,
    walletContractName,
    factoryContractName,
    tx,
    onChangeWallet,
    refreshToggle,
    setRefreshToggle,
    walletData,
    setWalletData,
    targetNetwork,
    multiSigWalletABI,
    importedWalletList,
    setImportedWalletList,
    userWallets,
    setUserWallets,
    hiddenWalletList,
    setHiddenWalletList,
  };

  return (
    <StoreProvider store={{ ...store }}>
      <AppLayout className="" header={HeaderBar}>
        <Switch>
          <Route exact path="/">
            {isWalletLoaded && walletContractName in readContracts && <Home key={selectedWalletAddress} />}
          </Route>

          <Route exact path="/createWallet">
            <CreateWallet />
          </Route>

          <Route exact path="/newTranscaction">
            <NewTranscaction />
          </Route>

          <Route exact path="/transcactions">
            <Transcations />
          </Route>

          <Route exact path="/apps">
            <SafeApps />
          </Route>

          <Route exact path="/safeApp">
            <SafeInjectProvider>
              <SafeApp />
            </SafeInjectProvider>
          </Route>

          <Route exact path="/manage">
            <Manage />
          </Route>

          <Route exact path="/help">
            <div>Work in progress...</div>
          </Route>
        </Switch>

        <ThemeSwitch />

        {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
        <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
          <Row align="middle" gutter={[4, 4]}>
            <Col span={8}>
              <Ramp price={price} address={address} networks={NETWORKS} />
            </Col>

            <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
              <GasGauge gasPrice={gasPrice} />
            </Col>
            <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
              <Button
                onClick={() => {
                  window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
                }}
                size="large"
                shape="round"
              >
                <span style={{ marginRight: 8 }} role="img" aria-label="support">
                  💬
                </span>
                Support
              </Button>
            </Col>
          </Row>

          <Row align="middle" gutter={[4, 4]}>
            <Col span={24}>
              {faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )}
            </Col>
          </Row>
        </div>
      </AppLayout>
    </StoreProvider>
  );
}

export default App;
