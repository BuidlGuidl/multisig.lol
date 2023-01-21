import React from "react";

import { Card, Collapse, Button } from "antd";
import QR from "qrcode.react";
import { useEffect, useState } from "react";

import { Address, Balance, Owners, WallectConnectInput } from "../components";

import { useContractReader } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { getFactoryVersion } from "../constants";
import { useStore } from "../store/useStore";

// import useEventListener from "../hooks/useEventListener";

// const { Text } = Typography;
const { Panel } = Collapse;

function Home() {
  const [state, dispatch] = useStore();
  const {
    BACKEND_URL,
    selectedWalletAddress,
    targetNetwork,
    address,
    userSigner,
    localProvider,
    price,
    mainnetProvider,
    blockExplorer,
    walletContractName,
    readContracts,
    writeContracts,
    factoryContractName,
    tx,
    signaturesRequired,
  } = state;
  const allExecuteTransactionEvents = useEventListener(
    factoryContractName in readContracts && readContracts,
    factoryContractName,
    "ExecuteTransaction",
    localProvider,
    1,
  );
  const pageSize = 10;
  const totalEvents = allExecuteTransactionEvents.length;

  // const nonce = useContractReader(readContracts, walletContractName, "nonce");

  // const signaturesRequired2 = useContractReader(readContracts, walletContractName, "signaturesRequired");
  // console.log(`n-🔴 => Home => signaturesRequired2`, signaturesRequired2?.toString());

  const [executeTransactionEvents, setExecuteTransactionEvents] = useState(undefined);
  const [walletName, setWalletName] = useState();
  const [txListLoading, setTxListLoading] = useState(true);

  const loadWalletData = async () => {
    let factoryVersion = await getFactoryVersion(readContracts[walletContractName]);
    if (factoryVersion === 1) {
      if (readContracts[walletContractName]) {
        let walletName = await readContracts[walletContractName].name();
        setWalletName(walletName);

        // on load wallet update latest nonce and signature required data
        let nonce = await readContracts[walletContractName].nonce();
        // let signaturesRequired = await readContracts[walletContractName].signaturesRequired();
        // dispatch({ payload: { nonce, signaturesRequired } });
      }
    } else {
      setWalletName("");
    }
  };

  useEffect(() => {
    if (readContracts && walletContractName in readContracts && selectedWalletAddress) {
      void loadWalletData();
    }
  }, [readContracts, selectedWalletAddress]);

  // useEffect(() => {
  //   if (nonce) {
  //     console.log(`n-🔴 => useEffect => nonce`, nonce?.toString());
  //   }
  // }, [nonce]);

  return (
    <>
      <div className=" flex flex-col justify-center items-center  m-2">
        {/* main contract info */}
        <div className="w-8/12">
          <Card title="wallet">
            <div className="flex  justify-around items-center   flex-wrap  w-full  p-4 md:w-auto">
              {/* contract balanace qr */}
              <div className="flex flex-col  items-center w-full p-5 border-2  rounded-3xl shadow-md  md:flex-1 md:p-0 md:shadow-none md:rounded-none md:w-auto md:border-none">
                <div>
                  <Balance
                    address={selectedWalletAddress ? selectedWalletAddress : ""}
                    provider={localProvider}
                    dollarMultiplier={price}
                    size={30}
                  />
                </div>
                <div className="px-20">
                  <QR
                    value={selectedWalletAddress ? selectedWalletAddress.toString() : ""}
                    size={150}
                    level="H"
                    includeMargin
                    renderAs="svg"
                    imageSettings={{ excavate: false, src: "", height: 0, width: 0 }}
                  />
                </div>

                <div className="text-xl">{walletName}</div>
                <div className="">
                  <Address
                    address={selectedWalletAddress ? selectedWalletAddress : ""}
                    ensProvider={mainnetProvider}
                    blockExplorer={blockExplorer}
                    fontSize={20}
                  />
                </div>
              </div>

              {/* contract owner signature */}
              <div className="w-full px-2 mt-4  md:mt-0 md:flex-1 md:w-96 ">
                <Owners
                  key={selectedWalletAddress}
                  signaturesRequired={signaturesRequired}
                  mainnetProvider={mainnetProvider}
                  blockExplorer={blockExplorer}
                  contractName={walletContractName}
                  localProvider={localProvider}
                  currentMultiSigAddress={selectedWalletAddress}
                  contractNameForEvent={walletContractName}
                  readContracts={readContracts}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="m-2 w-8/12">
          <Card title="wallet connect">
            <div className="flex flex-col items-center justify-center">
              <WallectConnectInput
                chainId={targetNetwork.chainId}
                walletAddress={selectedWalletAddress}
                mainnetProvider={mainnetProvider}
                price={price}
              />
            </div>
          </Card>
        </div>

        {/* tx pool */}
        {/* <div className="flex justify-center w-7/12 p-2 mt-2">
          {nonce && (
            <Transcactions
              BACKEND_URL={BACKEND_URL}
              address={address}
              blockExplorer={blockExplorer}
              contractName={contractName}
              localProvider={localProvider}
              mainnetProvider={mainnetProvider}
              nonce={nonce}
              price={price}
              readContracts={readContracts}
              signaturesRequired={signaturesRequired}
              tx={tx}
              userSigner={userSigner}
              writeContracts={writeContracts}
              key={nonce}
            />
          )}
        </div> */}

        {/* executed tx's */}
        {/* <div className="flex justify-center w-7/12 p-2 mt-2">
          <ExecutedTranscactions
            localProvide={localProvider}
            price={price}
            mainnetProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            contractName={contractName}
            readContracts={readContracts}
            currentMultiSigAddress={currentMultiSigAddress}
            contractNameForEvent={contractNameForEvent}
          />
        </div> */}
      </div>
    </>
  );
}

export default Home;
