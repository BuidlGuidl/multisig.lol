import { parseEther } from "@ethersproject/units";
import { Button, List, Spin } from "antd";
import axios from "axios";
import { usePoller } from "eth-hooks";
import { ethers } from "ethers";
import { useState } from "react";

import { useThemeSwitcher } from "react-css-theme-switcher";
import { TransactionListItem } from "../components";

export default function Transactions({
  BACKEND_URL,
  contractName,
  signaturesRequired,
  address,
  nonce,
  userSigner,
  mainnetProvider,
  localProvider,
  price,
  tx,
  readContracts,
  writeContracts,
  blockExplorer,
}) {
  const [transactions, setTransactions] = useState();
  const { currentTheme } = useThemeSwitcher();

  //   interval polling tx data
  usePoller(() => {
    if (readContracts[contractName]) getTransactions();
  }, 3777);

  const getTransactions = async () => {
    const res = await axios.get(
      BACKEND_URL + readContracts[contractName].address + "_" + localProvider._network.chainId,
    );

    console.log(`getTransactions => res.data`, res.data);
    const txDataPoolData = res.data;

    const sortedTxs = [];
    for (const hashValue in txDataPoolData) {
      const thisNonce = ethers.BigNumber.from(txDataPoolData[hashValue].nonce);
      if (thisNonce && nonce && thisNonce.gte(nonce)) {
        const validSignatures = [];
        for (const sig in txDataPoolData[hashValue].signatures) {
          const signer = await readContracts[contractName].recover(
            txDataPoolData[hashValue].hash,
            txDataPoolData[hashValue].signatures[sig],
          );
          const isOwner = await readContracts[contractName].isOwner(signer);
          if (signer && isOwner) {
            validSignatures.push({ signer, signature: txDataPoolData[hashValue].signatures[sig] });
          }
        }

        txDataPoolData[hashValue].nonce = thisNonce;

        const update = { ...txDataPoolData[hashValue], validSignatures };
        sortedTxs.push(update);
      }
    }

    console.log(`getTransactions => newTransactions`, sortedTxs);

    setTransactions(sortedTxs);
  };

  const getSortedSigList = async (allSigs, newHash) => {
    const sigList = [];
    for (const sig in allSigs) {
      const recover = await readContracts[contractName].recover(newHash, allSigs[sig]);
      sigList.push({ signature: allSigs[sig], signer: recover });
    }

    sigList.sort((a, b) => {
      return ethers.BigNumber.from(a.signer).sub(ethers.BigNumber.from(b.signer));
    });

    const finalSigList = [];
    const finalSigners = [];
    const used = {};
    for (const sig in sigList) {
      if (!used[sigList[sig].signature]) {
        finalSigList.push(sigList[sig].signature);
        finalSigners.push(sigList[sig].signer);
      }
      used[sigList[sig].signature] = true;
    }

    return [finalSigList, finalSigners];
  };
  const getGasLimit = async (item, finalSigList) => {
    try {
      // get estimate gas for a execute tx
      let estimateGasLimit = await writeContracts[contractName].estimateGas.executeTransaction(
        item.to,
        parseEther("" + parseFloat(item.amount).toFixed(12)),
        item.data,
        finalSigList,
      );
      estimateGasLimit = await estimateGasLimit.toNumber();

      console.log("estimateGasLimit", estimateGasLimit);

      // add extra 50k gas
      let finalGaslimit = estimateGasLimit + 50000;
      return finalGaslimit;
    } catch (e) {
      console.log("Failed to estimate gas");
      return 250000;
    }
  };

  const onSign = async (item, index) => {
    const newHash = await readContracts[contractName].getTransactionHash(
      item.nonce,
      item.to,
      parseEther("" + parseFloat(item.amount).toFixed(12)),
      item.data,
    );

    const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
    const recover = await readContracts[contractName].recover(newHash, signature);
    const isOwner = await readContracts[contractName].isOwner(recover);
    if (isOwner) {
      const [finalSigList, finalSigners] = await getSortedSigList([...item.signatures, signature], newHash);

      const res = await axios.post(BACKEND_URL, {
        ...item,
        signatures: finalSigList,
        signers: finalSigners,
      });
    }
  };
  const onExecute = async (item, index) => {
    const newHash = await readContracts[contractName].getTransactionHash(
      item.nonce,
      item.to,
      parseEther("" + parseFloat(item.amount).toFixed(12)),
      item.data,
    );

    const [finalSigList, finalSigners] = await getSortedSigList(item.signatures, newHash);

    let finalGaslimit = await getGasLimit(item, finalSigList);

    tx(
      writeContracts[contractName].executeTransaction(
        item.to,
        parseEther("" + parseFloat(item.amount).toFixed(12)),
        item.data,
        finalSigList,
        { gasLimit: finalGaslimit },
      ),
      async update => {
        if (update && (update.status === "confirmed" || update.status === 1)) {
          try {
            const parsedData = item.data !== "0x" ? readContracts[contractName].interface.parseTransaction(item) : null;
            // get all existing owner list
            let ownnersCount = await readContracts[contractName].numberOfOwners();
            /**----------------------
             * update owners on api at add signer
             * ---------------------*/
            if (parsedData && ["addSigner", "removeSigner"].includes(parsedData.name)) {
              // let finalOwnerList = [parsedData.args.newSigner, ...item.signers];
              let ownerAddress = address;
              let contractAddress = readContracts[contractName].address;
              let owners = [];
              ownnersCount = ownnersCount.toString();
              for (let index = 0; index < +ownnersCount; index++) {
                let owner = await readContracts[contractName].owners(index);
                owners.push(owner);
              }
              let reqData = { owners: owners };
              const res = await axios.post(BACKEND_URL + `updateOwners/${ownerAddress}/${contractAddress}`, reqData);
              console.log("update owner response", res.data);
            }
          } catch (error) {
            console.log(`🔴 Error`, error);
          }
        }
      },
    );
  };

  if (!signaturesRequired) {
    return <Spin />;
  }

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <h1>Transcaction pool</h1>
      <h1
        className={`p-2 mt-1 w-1/12 ${
          currentTheme === "light" ? "bg-gray-100 border-2" : "border border-gray-300"
        } rounded-xl text-md`}
      >
        #{nonce ? nonce.toNumber() : <Spin />}
      </h1>
      <div className="w-full">
        <List
          // bordered
          dataSource={transactions}
          renderItem={(item, index) => {
            const hasSigned = item.signers.indexOf(address) >= 0;
            const hasEnoughSignatures = item.signatures.length <= signaturesRequired.toNumber();

            return (
              <div className="border-2 rounded-2xl shadow-md mt-4">
                <TransactionListItem
                  item={item}
                  mainnetProvider={mainnetProvider}
                  blockExplorer={blockExplorer}
                  price={price}
                  readContracts={readContracts}
                  contractName={contractName}
                >
                  <div
                    // style={{ padding: 16 }}
                    className={`${
                      currentTheme === "light" ? "bg-gray-100" : ""
                    } border-2 rounded-2xl flex justify-center items-center `}
                  >
                    <div className="w-14">
                      {item.signatures.length}/{signaturesRequired.toNumber()} {hasSigned ? "✅" : ""}
                    </div>
                    <div className="w-full flex justify-between p-2">
                      <Button
                        type="secondary"
                        onClick={async () => {
                          onSign(item, index);
                        }}
                      >
                        Sign
                      </Button>
                      <Button
                        key={item.hash}
                        type={hasEnoughSignatures ? "primary" : "secondary"}
                        onClick={async () => {
                          onExecute(item, index);
                        }}
                      >
                        Exec
                      </Button>
                    </div>
                  </div>
                </TransactionListItem>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
