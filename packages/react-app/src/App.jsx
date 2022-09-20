import { Button, Col, Menu, Row, Select } from "antd";
import Routes from "./Routes";

// import CreateMultiSigModal from "./components/MultiSig/CreateMultiSigModal";

import "antd/dist/antd.css";
import { useOnBlock } from "eth-hooks";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  CreateMultiSigModal,
  Faucet,
  FaucetHint,
  GasGauge,
  Header,
  ImportMultiSigModal,
  NetworkDisplay,
  NetworkSwitch,
  Ramp,
  ThemeSwitch,
} from "./components";
import { ALCHEMY_KEY, NETWORKS } from "./constants";
//import multiSigWalletABI from "./contracts/multi_sig_wallet";
// contracts
import axios from "axios";
import MultiSigWalletAbi from "./configs/MultiSigWallet_ABI.json";
import deployedContracts from "./contracts/hardhat_contracts.json";

import { Web3ModalSetup } from "./helpers";
import { useLocalStorage } from "./hooks";
import useApp from "./hooks/useApp";

const { Option } = Select;
const { ethers } = require("ethers");

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.mainnet; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)
// const initialNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

/**----------------------
 * taking hardcoded multi sig wallet abi from MultiSigWallet_ABI.json file
 * note: if you update MultiSigWallet.sol file then you need to update this file from hardhat artifacts wallet
 * ---------------------*/
const multiSigWalletABI = MultiSigWalletAbi["abi"];

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

  const cachedNetwork = window.localStorage.getItem("network");
  let targetNetwork = NETWORKS[cachedNetwork || "mainnet"];

  /**----------------------
   * local states
   * ---------------------*/
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [userWallets, setUserWallets] = useState(undefined);
  const [reDeployWallet, setReDeployWallet] = useState(undefined);
  const [updateServerWallets, setUpdateServerWallets] = useState(false);
  const location = useLocation();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [multiSigs, setMultiSigs] = useState([]);
  const [currentMultiSigAddress, setCurrentMultiSigAddress] = useState();
  const [signaturesRequired, setSignaturesRequired] = useState();
  const [nonce, setNonce] = useState(0);
  const [contractNameForEvent, setContractNameForEvent] = useState();
  // const [ownerEvents, setOwnerEvents] = useState();
  // const [executeTransactionEvents, setExecuteTransactionEvents] = useState();

  const [importedMultiSigs] = useLocalStorage("importedMultiSigs");
  const [multiSigFactoryData, setMultiSigFactoryData] = useLocalStorage("multiSigFactoryData");

  const [mainWalletConnectSession, setMainWalletConnectSession] = useLocalStorage("walletConnectSession_main");
  const [selectedWalletAddress, setSelectedWalletAddress] = useLocalStorage("selectedWalletAddress");

  /**----------------------
   * initial configs
   * ---------------------*/

  // backend transaction handler:
  let BACKEND_URL = "http://localhost:49899/";
  if (targetNetwork && targetNetwork.name && targetNetwork.name != "localhost") {
    BACKEND_URL = "https://backend.multisig.lol:49899/";
  }

  if (!targetNetwork) targetNetwork = NETWORKS["mainnet"];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  let isFactoryDeployed = deployedContracts[targetNetwork.chainId];
  const contractName = "MultiSigWallet";

  /**----------------------
   * apps root providers and setup configs
   * ---------------------*/
  const {
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
  } = useApp({
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
  });

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // console.log("n-readContracts: ", readContracts);

  /**----------------------
   * methods
   * ---------------------*/

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }

    // ON LOGOUT REMOVING ALL WALLET CONNECT SESSIONS
    localStorage.removeItem("walletconnect");
    localStorage.removeItem("walletConnectSession_wallet");
    localStorage.removeItem("walletConnectSession_main");
    localStorage.removeItem("walletConnectUri_wallet");
    localStorage.removeItem("isConnected_wallet");
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  const handleMultiSigChange = value => {
    setContractNameForEvent(null);
    setCurrentMultiSigAddress(value);
    setSelectedWalletAddress(value);
  };

  async function getAddress() {
    if (userSigner) {
      const newAddress = await userSigner.getAddress();
      setAddress(newAddress);
    }
  }

  const updateUserWallets = () => {
    let multiSigsForUser = userWallets && [...userWallets.map(data => data.walletAddress)];

    const recentMultiSigAddress = multiSigsForUser && multiSigsForUser[multiSigsForUser.length - 1];
    setCurrentMultiSigAddress(recentMultiSigAddress);
    // setMultiSigs(multiSigsForUser);
  };

  const createEthersContractWallet = () => {
    async function getContractValues() {
      const latestSignaturesRequired = await readContracts.MultiSigWallet.signaturesRequired();
      setSignaturesRequired(latestSignaturesRequired);

      const nonce = await readContracts.MultiSigWallet.nonce();
      setNonce(nonce);
    }

    let currentMultiSig = userWallets && userWallets.find(data => data.walletAddress === currentMultiSigAddress);
    let currentMultiSigChainIds = currentMultiSig?.chainIds;

    // on load contracts if current sig on  same chain id
    if (
      currentMultiSigAddress &&
      currentMultiSigChainIds &&
      currentMultiSigChainIds.map(id => Number(id))?.includes(Number(selectedChainId))
    ) {
      readContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, localProvider);
      writeContracts.MultiSigWallet = new ethers.Contract(currentMultiSigAddress, multiSigWalletABI, userSigner);
      setContractNameForEvent("MultiSigWallet");
      getContractValues();
      setReDeployWallet(undefined);
    } else {
      setReDeployWallet(currentMultiSig);
    }
  };

  const syncWalletsWithServer = async () => {
    // let factoryVersion = await getFactoryVersion();
    let totalWalletCount = await readContracts["MultiSigFactory"]?.numberOfMultiSigs();
    totalWalletCount = totalWalletCount ? totalWalletCount.toNumber() : 0;

    if (totalWalletCount !== 0 && totalWalletCount === walletCreate2Events.length && updateServerWallets === false) {
      // if (userWallets !== undefined && totalWalletCount !== userWallets.length) {
      let walletsData = walletCreate2Events.map(data => data.args);
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
        // console.log("update wallets on api res data: ", data);
      }
      setUpdateServerWallets(true);
      // }
    }
  };

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

  const getUserWallets = async isUpdate => {
    if (isFactoryDeployed !== undefined) {
      let res = await axios.get(BACKEND_URL + `getWallets/${address}`);
      let data = res.data;

      let localWallets =
        importedMultiSigs && targetNetwork.name in importedMultiSigs ? [...importedMultiSigs[targetNetwork.name]] : [];

      let allWallets = [...localWallets, ...data["userWallets"]].flat();

      // setUserWallets(data["userWallets"]);
      setUserWallets(allWallets);

      // console.log("n-importedMultiSigs[targetNetwork.name]: ", importedMultiSigs[targetNetwork.name]);

      // set and reset  ContractNameForEvent to load the ownerevents
      setContractNameForEvent(null);
      setTimeout(() => {
        setContractNameForEvent("MultiSigWallet");
      }, 100);

      if (isUpdate) {
        // const lastMultiSigAddress = data["userWallets"][data["userWallets"].length - 1]?.walletAddress;
        const lastMultiSigAddress = allWallets[allWallets.length - 1]?.walletAddress;
        console.log("lastMultiSigAddress: ", lastMultiSigAddress);
        setCurrentMultiSigAddress(lastMultiSigAddress);
        setContractNameForEvent(null);
        setIsCreateModalVisible(false);

        setTimeout(() => {
          setContractNameForEvent("MultiSigWallet");
        }, 100);
      }
    }
  };

  const onChangeNetwork = async value => {
    if (targetNetwork.chainId != NETWORKS[value].chainId) {
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

  /**----------------------
   * useEffect hooks
   * ---------------------*/

  /**----------------------
   * load the main wallet connect configs if they are available
   * ---------------------*/

  useEffect(() => {
    /**----------------------
     * load default main WC session if it exists
     * ---------------------*/
    // let oldWalletConnect = localStorage.getItem("walletconnect");

    if (mainWalletConnectSession !== undefined) {
      localStorage.setItem("walletconnect", JSON.stringify(mainWalletConnectSession));
    }
    // return () => {
    // };
  }, []);

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
  }, []);

  /**----------------------
   * on factory address change remove imported wallets from localstorage
   * ---------------------*/

  useEffect(() => {
    if (deployedContracts[targetNetwork.chainId] && deployedContracts[targetNetwork.chainId][targetNetwork.name]) {
      let currentFactoryContractAddres =
        deployedContracts[targetNetwork.chainId][targetNetwork.name]["contracts"]["MultiSigFactory"].address;

      if (multiSigFactoryData === undefined) {
        localStorage.removeItem("importedMultiSigs");
        setMultiSigFactoryData({ ...multiSigFactoryData, [`${targetNetwork.name}`]: currentFactoryContractAddres });

        return;
      }

      if (multiSigFactoryData !== undefined) {
        let oldFactoryAddress = multiSigFactoryData[`${targetNetwork.name}`];
        let isNewFactoryDeployed = currentFactoryContractAddres !== oldFactoryAddress;
        if (isNewFactoryDeployed) {
          localStorage.removeItem("importedMultiSigs");
          setMultiSigFactoryData({ ...multiSigFactoryData, [`${targetNetwork.name}`]: currentFactoryContractAddres });
        }
      }
    }
  }, [userSigner]);

  /**----------------------
   * set main account address once provider and signer loads
   * ---------------------*/
  useEffect(() => {
    getAddress();
  }, [userSigner]);

  /**----------------------
   * load user sig wallets data from api
   * ---------------------*/

  useEffect(() => {
    if (address && userWallets) {
      updateUserWallets();
    }
  }, [userWallets && userWallets.length, address]);

  /**----------------------
   * set nounce and signatures required
   * ---------------------*/
  useEffect(() => {
    setSignaturesRequired(signaturesRequiredContract);
    setNonce(nonceContract);
  }, [signaturesRequiredContract, nonceContract]);

  /**----------------------
   * load selected wallet contract to read and write
   * ---------------------*/

  useEffect(() => {
    if (currentMultiSigAddress) {
      createEthersContractWallet();
    }
  }, [currentMultiSigAddress, readContracts, writeContracts, selectedChainId]);

  /**----------------------
   * sync wallets with server on load
   * ---------------------*/
  useEffect(() => {
    void syncWalletsWithServer();
  }, [walletCreate2Events.length, userWallets && userWallets.length]);

  /**----------------------
   * load web3 modal
   * ---------------------*/
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  /**----------------------
   * LOAD THE USER WALLETS DATA
   * ---------------------*/

  useEffect(() => {
    if (address !== undefined) {
      getUserWallets(false);
    }
  }, [address, updateServerWallets]);

  /**----------------------
   * set current selected sig address from localstorage
   * ---------------------*/

  useEffect(() => {
    if (selectedWalletAddress && userWallets && userWallets.length > 0 && address) {
      setCurrentMultiSigAddress(selectedWalletAddress);
    }
  }, [selectedWalletAddress, userWallets, address]);

  /**----------------------
   * --------- DYANAMIC VALUES
   * ---------------------*/
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const userHasMultiSigs = currentMultiSigAddress ? true : false;

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
      onChange={onChangeNetwork}
    >
      {selectNetworkOptions}
    </Select>
  );

  // top header bar
  const HeaderBar = (
    <>
      <Header>
        <div className="relative " key={address}>
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
              isFactoryDeployed={isFactoryDeployed}
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

  const WalletActions = (
    <>
      <div key={address} className="flex justify-start items-center p-2 my-2  flex-wrap ">
        <div>
          <CreateMultiSigModal
            key={address}
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
            currentNetworkName={targetNetwork.name}
            isFactoryDeployed={isFactoryDeployed}
          />
        </div>

        <div className="m-2  w-16">
          <ImportMultiSigModal
            mainnetProvider={mainnetProvider}
            targetNetwork={targetNetwork}
            networkOptions={selectNetworkOptions}
            // multiSigs={multiSigs}
            // setMultiSigs={setMultiSigs}
            // setCurrentMultiSigAddress={setCurrentMultiSigAddress}
            multiSigWalletABI={multiSigWalletABI}
            localProvider={localProvider}
            // poolServerUrl={BACKEND_URL}
            getUserWallets={getUserWallets}
            isFactoryDeployed={isFactoryDeployed}
            setSelectedWalletAddress={setSelectedWalletAddress}
          />
        </div>
        <div className="m-2  w-28">
          <Select
            className="w-full"
            // value={[currentMultiSigAddress]}
            value={currentMultiSigAddress}
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

  const MainMenu = (
    <div className="flex justify-center mt-5" key={address}>
      <Menu disabled={!userHasMultiSigs} selectedKeys={[location.pathname]} mode="horizontal">
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

  const BurnerWallet = (
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

  return (
    <div className="App">
      {HeaderBar}
      {WalletActions}
      {MainMenu}
      {Object.keys(writeContracts).length > 0 && Object.keys(readContracts).length > 0 && (
        <>
          <Routes
            // key={currentMultiSigAddress}
            // allOwnerEvents={allOwnerEvents}
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
            // executeTransactionEvents={executeTransactionEvents}
            gasPrice={gasPrice}
            localProvider={localProvider}
            mainnetContracts={mainnetContracts}
            mainnetProvider={mainnetProvider}
            nonce={nonce}
            // ownerEvents={ownerEvents}
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
            reDeployWallet={reDeployWallet}
            isFactoryDeployed={isFactoryDeployed}
            contractNameForEvent={contractNameForEvent}
          />
        </>
      )}
      <ThemeSwitch />

      {BurnerWallet}
    </div>
  );
}

export default App;
