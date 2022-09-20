import React from "react";
import { Balance, Address, TransactionListItem, Owners } from "../components";
import QR from "qrcode.react";
import { List, Button, Alert } from "antd";
import { useState } from "react";
import { useEffect } from "react";
import { useEventListener } from "eth-hooks/events/";
import { getFactoryVersion, Sleep } from "../constants";

function Home({
  address,
  contractAddress,
  localProvider,
  price,
  mainnetProvider,
  blockExplorer,
  // executeTransactionEvents,
  contractName,
  readContracts,
  // ownerEvents,
  signaturesRequired,
  reDeployWallet,
  // poolServerUrl,
  currentMultiSigAddress,
  contractNameForEvent,
}) {
  const allExecuteTransactionEvents = useEventListener(
    currentMultiSigAddress && reDeployWallet === undefined ? readContracts : null,
    contractNameForEvent,
    "ExecuteTransaction",
    localProvider,
    1,
  );

  const [executeTransactionEvents, setExecuteTransactionEvents] = useState();
  const [walletName, setWalletName] = useState();

  const updateExecutedEvents = () => {
    const filteredEvents = allExecuteTransactionEvents.filter(
      contractEvent => contractEvent.address === currentMultiSigAddress,
    );
    // const nonceNum = typeof nonce === "number" ? nonce : nonce?.toNumber();
    // if (nonceNum === filteredEvents.length) {
    setExecuteTransactionEvents(filteredEvents.reverse());
    // }
  };

  const getWalletName = async () => {
    // wait for 1 sec to get proper contract instance
    await Sleep(1000);
    let factoryVersion = await getFactoryVersion(readContracts[contractName]);
    if (factoryVersion === 1) {
      if (readContracts[contractName] && reDeployWallet === undefined) {
        // console.log("n-factoryVersion: calling with this version ", factoryVersion);
        // console.log("n-addres: address is ", readContracts[contractName].address);
        let walletName = await readContracts[contractName].name();
        setWalletName(walletName);
      }
    } else {
      setWalletName("");
    }
  };
  useEffect(() => {
    // setTimeout(() => {
    //   if (readContracts[contractName] !== null) {
    //     void getWalletName();
    //   }
    // }, 1000);

    void getWalletName();
  }, [readContracts[contractName]].address);

  useEffect(() => {
    updateExecutedEvents();
  }, [allExecuteTransactionEvents, currentMultiSigAddress]);

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
        <div className="flex  justify-around  flex-wrap  w-full border-2 p-4 md:w-auto md:rounded-3xl md:shadow-md ">
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
          <div
            // style={{ padding: 32 }}
            className="w-full px-2 mt-4  md:mt-0 md:flex-1 md:w-96 "
          >
            <Owners
              // ownerEvents={ownerEvents}
              signaturesRequired={signaturesRequired}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              // address={address}
              // poolServerUrl={poolServerUrl}
              // contractAddress={contractAddress}
              localProvider={localProvider}
              currentMultiSigAddress={currentMultiSigAddress}
              reDeployWallet={reDeployWallet}
              contractNameForEvent={contractNameForEvent}
              readContracts={readContracts}
            />
          </div>
        </div>

        {/* proposal create button */}
        <div
          // style={{ padding: 64 }}

          className="my-5"
        >
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
// export default Home;
