import React from "react";
import { Balance, Address, TransactionListItem, Owners } from "../components";
import QR from "qrcode.react";
import { List, Button } from "antd";
import { useState } from "react";
import { useEffect } from "react";

function Home({
  contractAddress,
  localProvider,
  price,
  mainnetProvider,
  blockExplorer,
  executeTransactionEvents,
  contractName,
  readContracts,
  ownerEvents,
  signaturesRequired,
  reDeployWallet,
}) {
  const [walletName, setWalletName] = useState();

  const getWalletName = async () => {
    if (readContracts[contractName] && reDeployWallet === undefined) {
      let walletName = await readContracts[contractName].name();
      setWalletName(walletName);
    }
  };
  useEffect(() => {
    void getWalletName();
  }, [readContracts[contractName]].address);
  return (
    <>
      <div
        //  style={{ padding: 32, maxWidth: 850, margin: "auto" }}
        className=" flex flex-col justify-center items-center  m-2 "
      >
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
                size="180"
                level="H"
                includeMargin
                renderAs="svg"
                imageSettings={{ excavate: false }}
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
              ownerEvents={ownerEvents}
              signaturesRequired={signaturesRequired}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
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
        <div className="flex justify-center items-center w-screen  ">
          <div className=" w-full md:w-1/2 ">
            <List
              bordered
              dataSource={executeTransactionEvents}
              renderItem={item => {
                return (
                  <div>
                    <TransactionListItem
                      item={Object.create(item)}
                      mainnetProvider={mainnetProvider}
                      blockExplorer={blockExplorer}
                      price={price}
                      readContracts={readContracts}
                      contractName={contractName}
                    />
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
