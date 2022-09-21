import { Button, Input, Badge, Spin } from "antd";
import { CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import WalletConnect from "@walletconnect/client";
import QrReader from "react-qr-reader";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import { useLocalStorage } from "../hooks";
import { parseExternalContractTransaction } from "../helpers";
import TransactionDetailsModal from "./MultiSig/TransactionDetailsModal";
import MultiSigWalletAbi from "../configs/MultiSigWallet_ABI.json";

let CLIENT_META = {
  description: "Forkable multisig for prototyping.",
  url: "https://multisig.lol",
  icons: ["https://multisig.lol/multisiglol.png"],
  name: "👛 multisig.lol",
};

const WalletConnectInput = ({ chainId, address, loadTransactionData, mainnetProvider, price }) => {
  // localstates
  const [data, setData] = useState();
  const [to, setTo] = useState();
  const [value, setValue] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parsedTransactionData, setParsedTransactionData] = useState();
  const [scan, setScan] = useState(false);
  const [walletConnect_wallet, setWalletConnect_wallet] = useState(undefined);
  const [walletLoading, setWalletLoading] = useState(false);

  // localstorage states
  const [walletConnectSession_wallet, setWalletConnectSession_wallet] = useLocalStorage(
    "walletConnectSession_wallet",
    undefined,
  );
  const [walletConnectSession_main, setWalletConnectSession_main] = useLocalStorage(
    "walletConnectSession_main",
    undefined,
  );

  const [walletConnectUri, setWalletConnectUri] = useLocalStorage("walletConnectUri_wallet", "");
  const [isConnected, setIsConnected] = useLocalStorage("isConnected_wallet", false);
  const [peerMeta, setPeerMeta] = useLocalStorage("peerMeta");
  // let location = useLocation();

  useEffect(() => {
    if (walletConnectUri && address) {
      let walletConnect_wallet_cached = localStorage.getItem("walletConnectSession_wallet");
      // console.log("n-walletConnect_wallet_cached: ", walletConnect_wallet_cached);
      if (Boolean(walletConnect_wallet_cached)) {
        // set old wallet connect data
        localStorage.setItem("walletconnect", walletConnect_wallet_cached);

        let walletConnectData = JSON.parse(walletConnect_wallet_cached);
        const connector = new WalletConnect({
          bridge: walletConnectData.bridge, // Required
          clientMeta: CLIENT_META,
        });

        // if (!connector.connected) {
        //   // create new session
        //   connector.createSession();
        // }

        subscribeToEvents(connector);
      }
    }
  }, [address]);

  //
  useEffect(() => {
    // if (!isConnected) {
    //   let nextSession = localStorage.getItem("wallectConnectNextSession");
    //   if (nextSession) {
    //     localStorage.removeItem("wallectConnectNextSession");
    //     console.log("FOUND A NEXT SESSION IN CACHE");
    //     console.log("this is the", nextSession);
    //     setWalletConnectUri(nextSession);
    //   } else if (walletConnectConnector) {
    //     console.log("NOT CONNECTED AND walletConnectConnector", walletConnectConnector);
    //     setupConnector(walletConnectConnector);
    //     setIsConnected(true);
    //   } else if (walletConnectUri /*&&!walletConnectUriSaved*/) {
    //     //CLEAR LOCAL STORAGE?!?
    //     console.log(" old uri was", walletConnectUri);
    //     console.log("clear local storage and connect...", nextSession);
    //     localStorage.removeItem("walletconnect"); // lololol
    //     setupConnector(
    //       {
    //         // Required
    //         uri: walletConnectUri,
    //         // Required
    //       } /*,
    //           {
    //             // Optional
    //             url: "<YOUR_PUSH_SERVER_URL>",
    //             type: "fcm",
    //             token: token,
    //             peerMeta: true,
    //             language: language,
    //           }*/,
    //     );
    //   }
    // }
  }, [walletConnectUri]);

  // useEffect(
  //   () => {
  //     if (address && !isConnected) {
  //       resetConnection();
  //     }
  //   },
  //   [address],
  //   isConnected,
  // );

  useEffect(() => {
    // set main wallet on load
    // let mainWalletConnect = localStorage.getItem("walletconnect");
    // if (mainWalletConnect !== null) {
    //   setWalletConnectSession_main(JSON.parse(mainWalletConnect));
    // }

    return () => {
      // let mainWalletConnect = localStorage.getItem("mainWalletConnectSession");
      // console.log("n-mainWalletConnect: ", mainWalletConnect);
      // // on unount set main WC instance
      // localStorage.setItem("walletconnect", mainWalletConnect);
      // killSession(false);
    };
  }, []);
  //

  useEffect(() => {
    // if (data && to) {
    if (to) {
      decodeFunctionData();
    }
  }, [data]);
  //

  const onWalletConnect = walletConnectUri => {
    setWalletLoading(true);
    const connector = setupConnector(walletConnectUri);
    // console.log("n-connector: ", connector);
    if (connector) {
      setWalletConnectUri(walletConnectUri);

      // create event listeners
      subscribeToEvents(connector);
    }
  };

  // const setupAndSubscribe = () => {
  //   const connector = setupConnector();
  //   console.log("n-connector: ", connector);
  //   if (connector) {
  //     subscribeToEvents(connector);
  //     setWalletConnectSession_wallet(connector);
  //   }
  // };

  const setupConnector = walletConnectUri => {
    console.log(" 📡 Connecting to Wallet Connect....", walletConnectUri);
    let connector;

    /**----------------------
     * check and save main wallet connect session
     * as wallet connect with contract on create proposal is conflicting with main wc instance
     * ---------------------*/
    let mainWalletConnect = localStorage.getItem("walletconnect");
    if (mainWalletConnect !== null) {
      setWalletConnectSession_main(JSON.parse(mainWalletConnect));
      // remove  main wallect connect session
      localStorage.removeItem("walletconnect");
    }

    try {
      // load wallet connect dynamically
      // const WalletConnect = require("@walletconnect/client").default;
      console.log("n-walletConnectUri: LOADED ", walletConnectUri);

      connector = new WalletConnect({ uri: walletConnectUri, clientMeta: CLIENT_META });

      // return connector;
    } catch (error) {
      console.log("n-error: ", error);
      console.error("setupConnector error:", error);
      localStorage.removeItem("walletConnectUri");
      setWalletConnectUri("");
      setWalletConnect_wallet(undefined);
      return;
    }
    return connector;
  };

  const subscribeToEvents = connector => {
    // console.log("n-connector: EVENT LISTENER ", connector);
    setWalletConnect_wallet(connector);

    connector.on("session_request", (error, payload) => {
      if (error) {
        console.log("n-error: session request ", error);
        throw error;
      }

      console.log("Event: session_request", payload);
      setPeerMeta(payload.params[0].peerMeta);

      connector.approveSession({
        accounts: [address],
        chainId,
      });

      // console.log("n-connector.connected: ", connector.connected);
      if (connector.connected) {
        setIsConnected(true);
        console.log("Session successfully connected.");

        console.log("WALLET CONNECTED !!! ", connector.connected);

        let walletConnect = localStorage.getItem("walletconnect");
        setWalletConnectSession_wallet(JSON.parse(walletConnect));
        setWalletLoading(false);
      }
    });
    //
    connector.on("call_request", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log("Event: call_request", payload);
      parseCallRequest(payload);
    });
    //

    connector.on("disconnect", (error, payload) => {
      console.log("disconnected ");
      console.log("Event: disconnect", payload);

      // remove wallet connect instance
      localStorage.removeItem("walletconnect");
      setWalletConnectSession_wallet("");

      resetConnection();

      setTimeout(() => {
        window.location.reload(true);
      }, 500);

      if (error) {
        throw error;
      }
    });
  };

  const parseCallRequest = payload => {
    const callData = payload.params[0];

    setValue(callData.value);
    setTo(callData.to);
    setData(callData.data ? callData.data : "0x");
  };
  //

  const decodeFunctionData = async () => {
    try {
      // console.log("n-decodeFunctionData: ", to, data);
      const parsedTransactionData = await parseExternalContractTransaction(to, data);
      // console.log("n-parsedTransactionData: ", parsedTransactionData);
      setParsedTransactionData(parsedTransactionData);
      setIsModalVisible(true);
    } catch (error) {
      console.log(error);
      setParsedTransactionData(null);
    }
  };
  //

  const killSession = (isReload = true) => {
    try {
      console.log("ACTION", "killSession");

      // remove WC of multisig
      localStorage.removeItem("walletConnectUri");
      console.log("the connection was reset");

      if (isReload) {
        if (isConnected) {
          //note: check disconnect event
          walletConnect_wallet.killSession();
        }

        // setIsConnected(false);
        // localStorage.removeItem("walletconnect");

        // console.log("n-walletConnectSession_main: ", walletConnectSession_main);
        // localStorage.setItem("walletconnect", JSON.stringify(walletConnectSession_main));

        // setTimeout(() => {
        //   // window.location.reload(true);
        // }, 500);
      }

      // resetConnection();
    } catch (error) {
      console.log("n-error:kill session ", error);
    }
  };
  //

  const hideModal = () => setIsModalVisible(false);

  const handleOk = () => {
    loadTransactionData({
      data,
      to,
      value,
    });
  };

  const resetConnection = () => {
    console.log("n-resetConnection: RESET EVERYTHING ");
    setWalletConnectUri("");
    setIsConnected(false);
    setWalletConnectSession_wallet("");
    setPeerMeta("");
    setData();
    setValue();
    setTo();
  };

  return (
    <>
      {scan ? (
        <div
          style={{
            zIndex: 256,
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
          }}
          onClick={() => {
            setScan(false);
          }}
        >
          <QrReader
            delay={250}
            resolution={1200}
            onError={e => {
              console.log("SCAN ERROR", e);
              setScan(false);
            }}
            onScan={newValue => {
              if (newValue) {
                console.log("SCAN VALUE", newValue);
                setScan(false);
                setWalletConnectUri(newValue);
              }
            }}
            style={{ width: "100%" }}
          />
        </div>
      ) : (
        ""
      )}

      <div className="flex flex-col items-center justify-center ">
        <div>
          <img src="walletconnect-logo.svg" alt="walletConnect" style={{ height: 50, width: 50 }} />
        </div>
        <div className="m-2">
          <Input.Group compact>
            <Input
              style={{ width: "calc(100% - 31px)", marginBottom: 20 }}
              placeholder="Paste WalletConnect URI"
              disabled={isConnected}
              value={walletConnectUri}
              // onChange={e => setWalletConnectUri(e.target.value)}
              onChange={e => onWalletConnect(e.target.value)}
            />
            <Button
              disabled={isConnected}
              onClick={() => setScan(!scan)}
              icon={
                <Badge count={<CameraOutlined style={{ fontSize: 9 }} />}>
                  <QrcodeOutlined style={{ fontSize: 18 }} />
                </Badge>
              }
            />
          </Input.Group>
        </div>
      </div>
      <div>{walletLoading && <Spin />}</div>
      <div>
        {isConnected && (
          <>
            {peerMeta !== undefined && (
              <>
                <div className="flex justify-center items-start w-full ">
                  <img src={peerMeta.icons[0]} style={{ width: 30, height: 25 }} />
                  <div>
                    <p>
                      <a href={peerMeta.url} target="_blank" rel="noreferrer">
                        {peerMeta.url}
                      </a>
                    </p>
                  </div>
                </div>
                <Button onClick={killSession} type="primary">
                  Disconnect
                </Button>
              </>
            )}
          </>
        )}
      </div>
      {/* {!isConnected && (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            // localStorage.removeItem("walletconnect");
            // setTimeout(() => {
            //   window.location.reload(true);
            // }, 500);
          }}
        >
          🗑
        </div>
      )} */}

      {isModalVisible && (
        <TransactionDetailsModal
          visible={isModalVisible}
          txnInfo={parsedTransactionData}
          handleOk={handleOk}
          handleCancel={hideModal}
          showFooter={true}
          mainnetProvider={mainnetProvider}
          price={price}
          to={to}
          value={value}
          type="Wallect Connect"
        />
      )}
    </>
  );
};
export default WalletConnectInput;
