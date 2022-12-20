import React from "react";

import { List, Pagination, Typography, Collapse } from "antd";
import QR from "qrcode.react";
import { useEffect, useState } from "react";

import { Address, Balance, Owners, SendEth, TransactionListItem } from "../components";

import { useContractReader } from "eth-hooks";
import { getFactoryVersion } from "../constants";
import Transcactions from "./Transcactions";
import { useEventListener } from "eth-hooks/events/useEventListener";
import ExecutedTranscactions from "../components/MultiSig/ExecutedTranscactions";

// import useEventListener from "../hooks/useEventListener";

// const { Text } = Typography;
const { Panel } = Collapse;

function Home({
  BACKEND_URL,
  contractAddress,
  address,
  userSigner,
  localProvider,
  price,
  mainnetProvider,
  blockExplorer,
  contractName,
  readContracts,
  writeContracts,
  currentMultiSigAddress,
  contractNameForEvent,
  tx,
}) {
  const allExecuteTransactionEvents = useEventListener(
    contractNameForEvent in readContracts && readContracts,
    contractNameForEvent,
    "ExecuteTransaction",
    localProvider,
    1,
  );
  const pageSize = 10;
  const totalEvents = allExecuteTransactionEvents.length;

  const signaturesRequired = useContractReader(readContracts, contractName, "signaturesRequired");
  const nonce = useContractReader(readContracts, contractName, "nonce");

  const [executeTransactionEvents, setExecuteTransactionEvents] = useState(undefined);
  const [walletName, setWalletName] = useState();
  const [txListLoading, setTxListLoading] = useState(true);

  const getWalletName = async () => {
    let factoryVersion = await getFactoryVersion(readContracts[contractName]);
    if (factoryVersion === 1) {
      if (readContracts[contractName]) {
        let walletName = await readContracts[contractName].name();
        setWalletName(walletName);
      }
    } else {
      setWalletName("");
    }
  };

  const pagePageChange = selectedPage => {
    const endIndex = selectedPage === 1 ? pageSize : selectedPage * pageSize;
    const startIndex = selectedPage === 1 ? selectedPage - 1 : endIndex - pageSize;

    const filteredEvents = allExecuteTransactionEvents
      .filter(contractEvent => contractEvent.address === currentMultiSigAddress)
      .slice(startIndex, endIndex);

    setExecuteTransactionEvents(filteredEvents.reverse());
    setTxListLoading(false);
  };

  useEffect(() => {
    void getWalletName();
  }, [readContracts[contractName]]);

  useEffect(() => {
    if (allExecuteTransactionEvents.length > 0) {
      pagePageChange(1);
    } else {
      setTxListLoading(false);
    }
  }, [allExecuteTransactionEvents]);

  return (
    <>
      <div className=" flex flex-col justify-center items-center  m-2 ">
        <div className="mb-2">
          <SendEth
            BACKEND_URL={BACKEND_URL}
            userSigner={userSigner}
            localProvider={localProvider}
            mainnetProvider={mainnetProvider}
            price={price}
            contractAddress={contractAddress}
            readContracts={readContracts}
            contractName={contractName}
          />
        </div>
        {/* main contract info */}
        <div className="flex  justify-around  flex-wrap  w-full border-2 p-4 md:w-auto md:rounded-3xl md:shadow-md">
          {/* contract balanace qr */}
          <div className="flex flex-col  items-center w-full p-5 border-2  rounded-3xl shadow-md  md:flex-1 md:p-0 md:shadow-none md:rounded-none md:w-auto md:border-none">
            <div>
              <Balance
                address={contractAddress ? contractAddress : ""}
                provider={localProvider}
                dollarMultiplier={price}
                size={40}
              />
            </div>
            <div className="px-20">
              <QR
                value={contractAddress ? contractAddress.toString() : ""}
                size={180}
                level="H"
                includeMargin
                renderAs="svg"
                imageSettings={{ excavate: false, src: "", height: 0, width: 0 }}
              />
            </div>

            <div className="text-2xl">{walletName}</div>
            <div className="">
              <Address
                address={contractAddress ? contractAddress : ""}
                ensProvider={mainnetProvider}
                blockExplorer={blockExplorer}
                fontSize={25}
              />
            </div>
          </div>

          {/* contract owner signature */}
          <div className="w-full px-2 mt-4  md:mt-0 md:flex-1 md:w-96 ">
            <Owners
              signaturesRequired={signaturesRequired}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              contractName={contractName}
              localProvider={localProvider}
              currentMultiSigAddress={currentMultiSigAddress}
              contractNameForEvent={contractNameForEvent}
              readContracts={readContracts}
            />
          </div>
        </div>

        {/* tx pool */}
        <div className="flex justify-center w-7/12 p-2 mt-2">
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
        </div>

        {/* executed tx's */}
        <div className="flex justify-center w-7/12 p-2 mt-2">
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
        </div>
      </div>
    </>
  );
}

export default Home;
