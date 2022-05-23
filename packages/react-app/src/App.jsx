import { Button, Col, Menu, Row, Alert, Select } from "antd";
import Routes from "./Routes";

import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { useEventListener } from "eth-hooks/events/";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
  CreateMultiSigModal,
  ImportMultiSigModal,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
//import multiSigWalletABI from "./contracts/multi_sig_wallet";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { Home, Hints, Subgraph, CreateTransaction, Transactions } from "./views";
import { useStaticJsonRPC, useLocalStorage } from "./hooks";
import axios from "axios";

const { Option } = Select;
const { ethers } = require("ethers");

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.mainnet; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

/**----------------------
 * taking  multi sig wallet abi from hardhat_contracts.json file
 * note: abi from hardcode location of localhost
 * ---------------------*/
// const multiSigWalletABI = deployedContracts["31337"]["localhost"]["contracts"]["MultiSigWallet"]["abi"];
const multiSigWalletABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_chainId",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "_owners",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "_signaturesRequired",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_factory",
        type: "address",
      },
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address payable",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "hash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "result",
        type: "bytes",
      },
    ],
    name: "ExecuteTransaction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "added",
        type: "bool",
      },
    ],
    name: "Owner",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newSigner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "newSignaturesRequired",
        type: "uint256",
      },
    ],
    name: "addSigner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "chainId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "bytes[]",
        name: "signatures",
        type: "bytes[]",
      },
    ],
    name: "executeTransaction",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_nonce",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "getTransactionHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isOwner",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nonce",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "owners",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_hash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
    ],
    name: "recover",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "oldSigner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "newSignaturesRequired",
        type: "uint256",
      },
    ],
    name: "removeSigner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "signaturesRequired",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newSignaturesRequired",
        type: "uint256",
      },
    ],
    name: "updateSignaturesRequired",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "rinkeby"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [userWallets, setUserWallets] = useState(undefined);
  const [walletsFetched, setWalletsFetched] = useState(undefined);
  const [reDeployWallet, setReDeployWallet] = useState(undefined);
  const [deployType, setDeployType] = useState("CREATE");
  const [updateServerWallets, setUpdateServerWallets] = useState(false);
  const location = useLocation();

  const cachedNetwork = window.localStorage.getItem("network");
  let targetNetwork = NETWORKS[cachedNetwork || "mainnet"];

  // backend transaction handler:
  let BACKEND_URL = "http://localhost:49899/";
  // let BACKEND_URL = "https://multisig-lol-backend.herokuapp.com/";
  if (targetNetwork && targetNetwork.name && targetNetwork.name != "localhost") {
    // BACKEND_URL = "https://backend.multisig.lol:49899/";
    BACKEND_URL = "https://multisig-lol-backend.herokuapp.com/"; // naim heroku backend
  }

  if (!targetNetwork) targetNetwork = NETWORKS["localhost"];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

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
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
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
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  // const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  // disabled externalContracts as it is taking old factory address or abi
  // const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };
  const contractConfig = { deployedContracts: deployedContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // const [readContracts, setReadContracts] = useState(readContractsSetup);

  const contractName = "MultiSigWallet";
  const contractAddress = readContracts?.MultiSigWallet?.address;

  //📟 Listen for broadcast events

  // MultiSigFactory Events:
  const ownersMultiSigEvents = useEventListener(readContracts, "MultiSigFactory", "Owners", localProvider, 1);
  const walletCreateEvents = useEventListener(readContracts, "MultiSigFactory", "Create", localProvider, 1);
  if (DEBUG) console.log("📟 ownersMultiSigEvents:", ownersMultiSigEvents);

  const [multiSigs, setMultiSigs] = useState([]);
  const [currentMultiSigAddress, setCurrentMultiSigAddress] = useState();

  const [importedMultiSigs] = useLocalStorage("importedMultiSigs");

  /*
    if you want to hardcode a specific multisig for the frontend for everyone:
  useEffect(()=>{
    if(userSigner){
      setCurrentMultiSigAddress("0x31787164D5A4ca8072035Eb89478e85f45C6d408")
    }
  },[userSigner])
  */

  /**----------------------
   * old code where we are loading contracts from listeners
   * ---------------------*/
  // useEffect(() => {
  //   if (address) {
  //     let multiSigsForUser = ownersMultiSigEvents.reduce((filtered, createEvent) => {
  //       if (createEvent.args.owners.includes(address) && !filtered.includes(createEvent.args.contractAddress)) {
  //         filtered.push(createEvent.args.contractAddress);
  //       }

  //       return filtered;
  //     }, []);

  //     if (importedMultiSigs && importedMultiSigs[targetNetwork.name]) {
  //       multiSigsForUser = [...new Set([...importedMultiSigs[targetNetwork.name], ...multiSigsForUser])];
  //     }

  //     if (multiSigsForUser.length > 0 && multiSigsForUser.length !== multiSigs.length) {
  //       const recentMultiSigAddress = multiSigsForUser[multiSigsForUser.length - 1];
  //       if (recentMultiSigAddress !== currentMultiSigAddress) setContractNameForEvent(null);
  //       setCurrentMultiSigAddress(recentMultiSigAddress);
  //       setMultiSigs(multiSigsForUser);
  //     }
  //   }
  // }, [ownersMultiSigEvents, address]);

  /**----------------------
   * load user sig wallets data from api
   * ---------------------*/
  useEffect(() => {
    if (address) {
      let multiSigsForUser = userWallets && [...userWallets.map(data => data.walletAddress)];

      if (importedMultiSigs && importedMultiSigs[targetNetwork.name]) {
        multiSigsForUser = [...new Set([...importedMultiSigs[targetNetwork.name], ...multiSigsForUser])];
      }
      const recentMultiSigAddress = multiSigsForUser && multiSigsForUser[multiSigsForUser.length - 1];
      setCurrentMultiSigAddress(recentMultiSigAddress);
      setMultiSigs(multiSigsForUser);
    }
  }, [userWallets && userWallets.length, address]);

  const [signaturesRequired, setSignaturesRequired] = useState();
  const [nonce, setNonce] = useState(0);

  const signaturesRequiredContract = useContractReader(
    reDeployWallet === undefined ? readContracts : null,
    contractName,
    "signaturesRequired",
  );
  const nonceContract = useContractReader(reDeployWallet === undefined ? readContracts : null, contractName, "nonce");
  useEffect(() => {
    setSignaturesRequired(signaturesRequiredContract);
    setNonce(nonceContract);
  }, [signaturesRequiredContract, nonceContract]);

  const [contractNameForEvent, setContractNameForEvent] = useState();

  useEffect(() => {
    async function getContractValues() {
      const latestSignaturesRequired = await readContracts.MultiSigWallet.signaturesRequired();
      setSignaturesRequired(latestSignaturesRequired);

      const nonce = await readContracts.MultiSigWallet.nonce();
      setNonce(nonce);
    }

    let currentMultiSig = userWallets && userWallets.find(data => data.walletAddress === currentMultiSigAddress);
    let currentMultiSigChainIds = currentMultiSig?.chainIds;

    // on load contracts if current sig on  same chain id
    if (currentMultiSigAddress && currentMultiSigChainIds.map(id => Number(id))?.includes(Number(selectedChainId))) {
      readContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, localProvider);
      writeContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, userSigner);
      setContractNameForEvent("MultiSigWallet");
      getContractValues();
      setReDeployWallet(undefined);
    } else {
      setReDeployWallet(currentMultiSig);
    }
  }, [currentMultiSigAddress, readContracts, writeContracts, selectedChainId]);

  // MultiSigWallet Events:
  const allExecuteTransactionEvents = useEventListener(
    currentMultiSigAddress && reDeployWallet === undefined ? readContracts : null,
    contractNameForEvent,
    "ExecuteTransaction",
    localProvider,
    1,
  );
  if (DEBUG) console.log("📟 executeTransactionEvents:", allExecuteTransactionEvents);

  const allOwnerEvents = useEventListener(
    currentMultiSigAddress && reDeployWallet === undefined ? readContracts : null,
    contractNameForEvent,
    "Owner",
    localProvider,
    1,
  );
  if (DEBUG) console.log("📟 ownerEvents:", allOwnerEvents);

  const [ownerEvents, setOwnerEvents] = useState();
  const [executeTransactionEvents, setExecuteTransactionEvents] = useState();

  useEffect(() => {
    setOwnerEvents(allOwnerEvents.filter(contractEvent => contractEvent.address === currentMultiSigAddress));
  }, [allOwnerEvents, currentMultiSigAddress, allOwnerEvents.length]);

  useEffect(() => {
    const filteredEvents = allExecuteTransactionEvents.filter(
      contractEvent => contractEvent.address === currentMultiSigAddress,
    );
    const nonceNum = typeof nonce === "number" ? nonce : nonce?.toNumber();
    if (nonceNum === filteredEvents.length) {
      setExecuteTransactionEvents(filteredEvents.reverse());
    }
  }, [allExecuteTransactionEvents, currentMultiSigAddress, nonce]);

  const loadMissingWallets = async () => {
    let totalWalletCount = await readContracts["MultiSigFactory"]?.numberOfMultiSigs();
    totalWalletCount = totalWalletCount ? totalWalletCount.toNumber() : 0;
    // console.log('nonce: ', nonce);

    if (totalWalletCount !== 0 && totalWalletCount === walletCreateEvents.length && updateServerWallets === false) {
      if (userWallets !== undefined && totalWalletCount !== userWallets.length) {
        console.log("n-fetch now: ", userWallets.length);

        let walletsData = walletCreateEvents.map(data => data.args);
        /**----------------------
         * iterating over create even data and send it to backend api to update
         * ---------------------*/
        for (let index = 0; index < walletsData.length; index++) {
          let wallet = walletsData[index];
          let walletName = wallet.name;
          let walletAddress = wallet.contractAddress;
          let creator = wallet.creator;
          let owners = wallet.owners;
          let signaturesRequired = wallet.signaturesRequired.toNumber();
          let reqData = {
            owners,
            signaturesRequired,
          };
          const res = await axios.post(
            BACKEND_URL + `createWallet/${creator}/${walletName}/${walletAddress}/${selectedChainId}`,
            reqData,
          );
          let data = res.data;
          console.log("update wallets on api res data: ", data);
        }
        setUpdateServerWallets(true);
      }
    }
  };

  useEffect(() => {
    void loadMissingWallets();
  }, [walletCreateEvents.length, userWallets && userWallets.length]);

  // EXTERNAL CONTRACT EXAMPLE:
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  // const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
  //   "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  // ]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
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

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  /**----------------------
   * LOAD THE USER WALLETS DATA
   * ---------------------*/

  const getUserWallets = async isUpdate => {
    let res = await axios.get(BACKEND_URL + `getWallets/${address}`);
    let data = res.data;
    setUserWallets(data["userWallets"]);
    setWalletsFetched(true);

    if (isUpdate) {
      const lastMultiSigAddress = data["userWallets"][data["userWallets"].length - 1]?.walletAddress;
      setCurrentMultiSigAddress(lastMultiSigAddress);
      setContractNameForEvent(null);
      setIsCreateModalVisible(false);

      setTimeout(() => {
        setContractNameForEvent("MultiSigWallet");
      }, 10);
    }
  };
  useEffect(() => {
    if (address !== undefined) {
      getUserWallets(false);
    }
  }, [address, updateServerWallets]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const userHasMultiSigs = currentMultiSigAddress ? true : false;

  const handleMultiSigChange = value => {
    setContractNameForEvent(null);
    setCurrentMultiSigAddress(value);
  };

  console.log("currentMultiSigAddress:", currentMultiSigAddress);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const selectNetworkOptions = [];
  for (const id in NETWORKS) {
    selectNetworkOptions.push(
      <Select.Option key={id} value={NETWORKS[id].name}>
        <span style={{ color: NETWORKS[id].color }}>{NETWORKS[id].name}</span>
      </Select.Option>,
    );
  }

  const networkSelect = (
    <Select
      className="w-full text-left"
      defaultValue={targetNetwork.name}
      // style={{ textAlign: "left", width: 170 }}
      onChange={value => {
        if (targetNetwork.chainId != NETWORKS[value].chainId) {
          window.localStorage.setItem("network", value);
          setTimeout(() => {
            window.location.reload();
          }, 1);
        }
      }}
    >
      {selectNetworkOptions}
    </Select>
  );

  // top header bar
  const HeaderBar = () => {
    return (
      <>
        <Header>
          <div className="relative ">
            <div className="flex flex-1 items-center p-1">
              {USE_NETWORK_SELECTOR && (
                // <div style={{ marginRight: 20 }}>
                <div className="mr-20">
                  <NetworkSwitch
                    networkOptions={networkOptions}
                    selectedNetwork={selectedNetwork}
                    setSelectedNetwork={setSelectedNetwork}
                  />
                </div>
              )}
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
              />
            </div>
            {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
              <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
            )}
          </div>
        </Header>

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
  };

  const WalletActions = () => {
    return (
      <>
        <div className="flex justify-start items-center p-2 my-2  flex-wrap ">
          <div>
            <CreateMultiSigModal
              reDeployWallet={reDeployWallet}
              setReDeployWallet={setReDeployWallet}
              poolServerUrl={BACKEND_URL}
              price={price}
              selectedChainId={selectedChainId}
              mainnetProvider={mainnetProvider}
              address={address}
              tx={tx}
              writeContracts={writeContracts}
              contractName={"MultiSigFactory"}
              isCreateModalVisible={isCreateModalVisible}
              setIsCreateModalVisible={setIsCreateModalVisible}
              getUserWallets={getUserWallets}
              deployType={deployType}
              setDeployType={setDeployType}
              currentNetworkName={targetNetwork.name}
            />
          </div>

          <div className="m-2  w-16">
            <ImportMultiSigModal
              mainnetProvider={mainnetProvider}
              targetNetwork={targetNetwork}
              networkOptions={selectNetworkOptions}
              multiSigs={multiSigs}
              setMultiSigs={setMultiSigs}
              setCurrentMultiSigAddress={setCurrentMultiSigAddress}
              multiSigWalletABI={multiSigWalletABI}
              localProvider={localProvider}
              poolServerUrl={BACKEND_URL}
            />
          </div>
          <div className="m-2  w-28">
            <Select
              className="w-full"
              value={[currentMultiSigAddress]}
              // style={{ width: 120, marginRight: 5 }}
              onChange={handleMultiSigChange}
            >
              {/* {multiSigs.map((address, index) => {
                return (
                  <Option key={index} value={address}>
                    {address}
                  </Option>
                );
              })} */}

              {userWallets &&
                userWallets.length > 0 &&
                userWallets.map((data, index) => {
                  return (
                    <Option key={index} value={data.walletAddress}>
                      {data.walletName}
                    </Option>
                  );
                })}
            </Select>
          </div>
          <div className="m-2  w-28 ">{networkSelect}</div>
        </div>
      </>
    );
  };

  const MainMenu = () => {
    return (
      <div className="flex justify-center mt-5">
        <Menu
          disabled={!userHasMultiSigs}
          // style={{ textAlign: "center", marginTop: 40 }}
          selectedKeys={[location.pathname]}
          mode="horizontal"
        >
          <Menu.Item key="/">
            <Link to="/">MultiSig</Link>
          </Menu.Item>
          <Menu.Item key="/create" disabled={reDeployWallet !== undefined}>
            <Link to="/create">Propose Transaction</Link>
          </Menu.Item>
          <Menu.Item key="/pool" disabled={reDeployWallet !== undefined}>
            <Link to="/pool">Pool</Link>
          </Menu.Item>
        </Menu>
      </div>
    );
  };

  const BurnerWallet = () => {
    return (
      <>
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
              {
                /*  if the local provider has a signer, let's show the faucet:  */
                faucetAvailable ? (
                  <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
                ) : (
                  ""
                )
              }
            </Col>
          </Row>
        </div>
      </>
    );
  };

  return (
    <div className="App">
      <HeaderBar />
      <WalletActions />
      <MainMenu />
      <Routes
        BACKEND_URL={BACKEND_URL}
        DEBUG={DEBUG}
        account={address}
        address={address}
        blockExplorer={blockExplorer}
        contractAddress={contractAddress}
        contractConfig={contractConfig}
        contractName={contractName}
        currentMultiSigAddress={currentMultiSigAddress}
        customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.DAI}
        executeTransactionEvents={executeTransactionEvents}
        gasPrice={gasPrice}
        localProvider={localProvider}
        mainnetContracts={mainnetContracts}
        mainnetProvider={mainnetProvider}
        nonce={nonce}
        ownerEvents={ownerEvents}
        poolServerUrl={BACKEND_URL}
        price={price}
        readContracts={readContracts}
        setIsCreateModalVisible={setIsCreateModalVisible}
        signaturesRequired={signaturesRequired}
        subgraphUri={props.subgraphUri}
        tx={tx}
        userHasMultiSigs={userHasMultiSigs}
        userSigner={userSigner}
        writeContracts={writeContracts}
        yourLocalBalance={yourLocalBalance}
        key={currentMultiSigAddress}
        reDeployWallet={reDeployWallet}
      />

      <ThemeSwitch />
      <BurnerWallet />
    </div>
  );
}

export default App;
