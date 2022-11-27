import React from "react";
import { useParams } from "react-router-dom";
import { ShareAltOutlined } from "@ant-design/icons";

import { Balance, Address, TransactionListItem, Owners } from "../components";
import QR from "qrcode.react";
import { List, Button, Alert, Typography, message } from "antd";
import { useState } from "react";
import { useEffect } from "react";
// import { useEventListener } from "eth-hooks/events/";
import { getFactoryVersion, Sleep } from "../constants";
import useEventListener from "../hooks/useEventListener";
import { useStore } from "../store/useStore";

const { Text } = Typography;

function Home({
  targetNetwork,
  address,
  contractAddress,
  localProvider,
  price,
  mainnetProvider,
  blockExplorer,
  contractName,
  readContracts,
  signaturesRequired,
  reDeployWallet,
  currentMultiSigAddress,
  contractNameForEvent,
}) {
  // const allExecuteTransactionEvents = useEventListener(
  //   currentMultiSigAddress && reDeployWallet === undefined ? readContracts : null,
  //   contractNameForEvent,
  //   "ExecuteTransaction",
  //   localProvider,
  //   1,
  // );
  const [state, dispatch] = useStore();

  const walletParams = useParams();

  const allExecuteTransactionEvents = useEventListener(
    currentMultiSigAddress && reDeployWallet === undefined ? readContracts : null,
    contractNameForEvent,
    "ExecuteTransaction",
    localProvider,
  );

  const [executeTransactionEvents, setExecuteTransactionEvents] = useState(undefined);
  const [walletName, setWalletName] = useState();
  const [txListLoading, setTxListLoading] = useState(true);

  const updateExecutedEvents = async () => {
    // old event listner logic
    const filteredEvents = allExecuteTransactionEvents.filter(
      contractEvent => contractEvent.address === currentMultiSigAddress,
    );
    setExecuteTransactionEvents(filteredEvents.reverse());
    setTxListLoading(false);
  };

  const getWalletName = async () => {
    // wait for 1 sec to get proper contract instance
    await Sleep(1000);
    let factoryVersion = await getFactoryVersion(readContracts[contractName]);
    if (factoryVersion === 1) {
      if (readContracts[contractName] && reDeployWallet === undefined) {
        let walletName = await readContracts[contractName].name();
        setWalletName(walletName);
      }
    } else {
      setWalletName("");
    }
  };
  useEffect(() => {
    void getWalletName();
  }, [readContracts[contractName]].address);

  useEffect(() => {
    if (readContracts[contractName]) {
      updateExecutedEvents();
    }
  }, [allExecuteTransactionEvents, currentMultiSigAddress, readContracts, contractName, readContracts[contractName]]);

  useEffect(() => {
    if ("walletAddress" in walletParams && "networkName" in walletParams) {
      dispatch({ payload: { walletParams } });
    } else {
      dispatch({ payload: { walletParams: undefined } });
    }
  }, [walletParams]);

  return (
    <>
      <div
        //  style={{ padding: 32, maxWidth: 850, margin: "auto" }}
        className=" flex flex-col justify-center items-center  m-2 "
      >
        {reDeployWallet !== undefined && (
          <>
            <div className="text-left my-2 w-1/2 ">
              <Alert message="Alert" description="Please deploy this wallet !!" type="warning" showIcon />
            </div>
          </>
        )}
        {/* main contract info */}
        <div className="flex  justify-around  flex-wrap  w-full border-2 p-4 md:w-auto md:rounded-3xl md:shadow-md">
          {/* contract balanace qr */}
          <div
            // style={{ paddingBottom: 32 }}
            className="flex flex-col  items-center w-full p-5 border-2  rounded-3xl shadow-md  md:flex-1 md:p-0 md:shadow-none md:rounded-none md:w-auto md:border-none"
          >
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
            <div
              // style={{ display: "flex", justifyContent: "center" }}
              className=""
            >
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
              key={walletParams && JSON.stringify(walletParams)}
              // ownerEvents={ownerEvents}
              signaturesRequired={signaturesRequired}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              // address={address}
              // poolServerUrl={poolServerUrl}
              // contractAddress={contractAddress}
              contractName={contractName}
              localProvider={localProvider}
              currentMultiSigAddress={currentMultiSigAddress}
              reDeployWallet={reDeployWallet}
              contractNameForEvent={contractNameForEvent}
              readContracts={readContracts}
            />
          </div>

          {/* share wallet url */}
          <div className="">
            <Text
              copyable={{
                icon: [
                  <ShareAltOutlined className="text-xl cursor-pointer" style={{ color: "#1890FF" }} />,
                  <ShareAltOutlined className="text-xl cursor-pointer" style={{ color: "greenyellow" }} />,
                ],
                text: `${window.location.origin}/${contractAddress}/${targetNetwork?.name}`,
                tooltips: ["Copy wallet share url", "Copied"],
              }}
            />
          </div>
        </div>

        {/* proposal create button */}
        <div className="my-5">
          {reDeployWallet === undefined && (
            <Button
              type={"primary"}
              onClick={() => {
                window.location = "/create";
              }}
            >
              Propose Transaction
            </Button>
          )}
        </div>
        <div className="flex justify-center items-center w-screen   ">
          {reDeployWallet === undefined && (
            <div className=" w-full md:w-1/2  py-5 ">
              <List
                // bordered

                dataSource={executeTransactionEvents}
                loading={txListLoading}
                renderItem={item => {
                  return (
                    <div className="border-2 rounded-3xl shadow-md mt-4 ">
                      {"MultiSigWallet" in readContracts && (
                        <>
                          <TransactionListItem
                            item={Object.create(item)}
                            mainnetProvider={mainnetProvider}
                            blockExplorer={blockExplorer}
                            price={price}
                            readContracts={readContracts}
                            contractName={contractName}
                          />
                        </>
                      )}
                    </div>
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
const checkProps = (preProps, nextProps) => {
  // let ownerEvents = nextProps.ownerEvents.filter(contractEvent => contractEvent.address === nextProps.contractAddress);
  return preProps.contractAddress === nextProps.contractAddress && preProps.reDeployWallet && nextProps.reDeployWallet;
};

export default React.memo(Home, checkProps);
