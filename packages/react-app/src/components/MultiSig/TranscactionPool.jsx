import React from "react";
import axios from "axios";
import { Card, Collapse, Button, Descriptions, Divider, Empty } from "antd";
import { parseEther } from "@ethersproject/units";

import { useEffect } from "react";
import { ethers } from "ethers";
import { usePoller } from "eth-hooks";
import moment from "moment";

import { useStore } from "../../store/useStore";
import { Address, Balance } from "..";
import { useState } from "react";
import { TX_TYPES } from "../../constants";

const poolData = [
  {
    txId: 22323,
    chainId: 31337,
    walletAddress: "0xbA61FFB5378D34aCD509205Fd032dFEBEc598975",
    nonce: "0",
    to: "0x0fAb64624733a7020D332203568754EB1a37DB89",
    amount: 0.0007152513035455008,
    data: "0x",
    hash: "0x58670d26e3add93a7480ceb162ad4b236f6306e260e91d7976c339b9279fee53",
    signatures: [
      "0x1f19e9e2bd95ec771926c4eba4c91e0d0da01e91f1188858edee9dd10cc61d7c26dc656a3fc7375053f3f7544136b7db4ed5c391624bb263330e12b5c7f1ed151b",
    ],
    signers: ["0x0fAb64624733a7020D332203568754EB1a37DB89"],
    type: "transfer",
    status: "success",
    url: "https://example.com",
    createdAt: "10-10-2023 10:10",
    executedAt: "10-10-2023 10:10",
    executedBy: "0x0fAb64624733a7020D332203568754EB1a37DB89",
    createdBy: "0x0fAb64624733a7020D332203568754EB1a37DB89",
  },
];
const { Panel } = Collapse;
const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

const TranscationPool = () => {
  const [queueList, setQueueList] = useState([]);
  const [state, dispatch] = useStore();

  const {
    nonce,
    address,
    BACKEND_URL,
    contractAddress,
    userSigner,
    localProvider,
    mainnetProvider,
    price,
    readContracts,
    writeContracts,
    walletContractName,
    targetNetwork,
    selectedWalletAddress,
    signaturesRequired,
    tx,
  } = state;

  const loadTxPoolList = async () => {
    try {
      const result = await axios.get(
        `${BACKEND_URL}/getPool/${targetNetwork.chainId}/${selectedWalletAddress}/${nonce?.toString()}/QUEUE`,
      );
      const { data } = result.data;
      // console.log(`n-🔴 => loadTxPoolList => data`, data);
      setQueueList(data);
    } catch (error) {
      // console.log(`n-🔴 => loadTxPoolList => error`, error);
    }
  };
  usePoller(() => {
    loadTxPoolList();
  }, 3777);

  useEffect(() => {
    if (nonce) {
      loadTxPoolList();
    }
  }, [nonce]);

  const onChange = key => {
    console.log(key);
  };

  /**
   sort the signatures in order
  */
  const sortSignatures = async (allSigs, newHash) => {
    const sigList = [];
    for (const sig in allSigs) {
      const recover = await readContracts[walletContractName].recover(newHash, allSigs[sig]);
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

  const onSign = async item => {
    const newHash = await readContracts[walletContractName].getTransactionHash(
      item.nonce,
      item.to,
      parseEther("" + parseFloat(item.amount).toFixed(12)),
      item.data,
    );

    const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
    const recover = await readContracts[walletContractName].recover(newHash, signature);
    const isOwner = await readContracts[walletContractName].isOwner(recover);
    // console.log(`n-🔴 => onSign => isOwner`, isOwner);
    if (isOwner) {
      const { txId, walletAddress, signers, signatures } = item;

      const reqData = {
        txId,
        walletAddress,
        chainId: targetNetwork.chainId,
        newData: {
          signatures: [...new Set([...signatures, signature])],
          signers: [...new Set([...signers, address])],
        },
      };

      // console.log(`n-🔴 => onSign => reqData`, reqData);

      const res = await axios.post(`${BACKEND_URL}/updateTx`, { ...reqData });
    }
  };
  const onExecute = async item => {
    console.log(`n-🔴 => onExecute => item`, item);
    const newHash = await readContracts[walletContractName].getTransactionHash(
      item.nonce,
      item.to,
      parseEther("" + parseFloat(item.amount).toFixed(12)),
      item.data,
    );
    console.log(`n-🔴 => onExecute => newHash`, newHash);
    const [finalSigList, finalSigners] = await sortSignatures(item.signatures, newHash);
    let finalGaslimit = 250000;

    try {
      // get estimate gas for a execute tx
      let estimateGasLimit = await writeContracts[walletContractName].estimateGas.executeTransaction(
        item.to,
        parseEther("" + parseFloat(item.amount).toFixed(12)),
        item.data,
        finalSigList,
      );
      estimateGasLimit = await estimateGasLimit.toNumber();

      console.log("estimateGasLimit", estimateGasLimit);

      // add extra 100k gas limit
      finalGaslimit = estimateGasLimit + 100000;
      // console.log(`n-🔴 => onExecute => finalGaslimit`, finalGaslimit);
    } catch (e) {
      console.log("Failed to estimate gas");
    }

    tx(
      writeContracts[walletContractName].executeTransaction(
        item.to,
        parseEther("" + parseFloat(item.amount).toFixed(12)),
        item.data,
        finalSigList,
        // { gasLimit: finalGaslimit, gasPrice },
        { gasLimit: finalGaslimit },
      ),
      async update => {
        if (update && (update.status === "confirmed" || update.status === 1)) {
          try {
            const { txId, walletAddress } = item;

            const reqData = {
              txId,
              walletAddress,
              chainId: targetNetwork.chainId,
              newData: {
                executedBy: address,
                executedAt: moment().format("YYYY-MM-DD HH:mm"),
                status: "success",
              },
            };

            // console.log(`n-🔴 => onSign => reqData`, reqData);

            const res = await axios.post(`${BACKEND_URL}/updateTx`, { ...reqData });
            // console.log(`n-🔴 => onExecute => res`, res.data);
          } catch (error) {
            console.log(`n-🔴 Error`, error);
            const { txId, walletAddress } = item;

            const reqData = {
              txId,
              walletAddress,
              chainId: targetNetwork.chainId,
              newData: {
                executedBy: address,
                executedAt: moment().format("YYYY-MM-DD HH:mm"),
                status: "rejected",
              },
            };

            // console.log(`n-🔴 => onSign => reqData`, reqData);
            const res = await axios.post(`${BACKEND_URL}/updateTx`, { ...reqData });
          }
        }
      },
    );
  };

  return (
    <div>
      <>
        <Collapse defaultActiveKey={["1"]} onChange={onChange} bordered={false}>
          {queueList.length > 0 &&
            queueList.map((data, index) => {
              return (
                <Panel
                  key={data["txId"]}
                  header={
                    <div className="flex justify-around">
                      <div># {data["nonce"]}</div>
                      <div>{data["type"]}</div>
                      <div>
                        {/* <Balance
                          balance={
                            data["amount"]
                              ? data["type"] === TX_TYPES.SAFE_APP
                                ? data["amount"]
                                : ethers.utils.parseEther(String(data["amount"]))
                              : 0
                          }
                          dollarMultiplier={price}
                          size={15}
                        /> */}
                      </div>
                      <div>{data["createdAt"]}</div>
                      <div>
                        <Button onClick={() => onSign(data)}>
                          {data["signatures"].length}/{signaturesRequired ? signaturesRequired.toString() : 0} Sign
                        </Button>
                      </div>
                      <div>
                        <Button type="primary" onClick={() => onExecute(data)}>
                          Execute
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <div className="flex flex-col">
                    <div className="flex justify-start">
                      <div className="m-2 underline text-green-700">
                        {data["type"] === TX_TYPES.SAFE_APP ? data["url"] : data["type"]}
                      </div>
                      <div className="m-2 font-bold">
                        {/* {Number(data["amount"]).toFixed(4)} */}

                        {/* <Balance
                          balance={
                            data["amount"]
                              ? data["type"] === TX_TYPES.SAFE_APP
                                ? data["amount"]
                                : ethers.utils.parseEther(String(data["amount"]))
                              : 0
                          }
                          dollarMultiplier={price}
                          size={15}
                        /> */}
                      </div>
                      <div className="m-2">to</div>
                      <div className="m-2">
                        <Address address={data["to"]} fontSize={15} />
                      </div>
                    </div>
                    <Divider />
                    <div className="flex flex-col">
                      <Descriptions title="Transcaction details" column={1} bordered>
                        <Descriptions.Item label="nonce">{data["nonce"]}</Descriptions.Item>
                        <Descriptions.Item label="hash">
                          <Address address={data["hash"]} fontSize={15} />
                        </Descriptions.Item>
                        <Descriptions.Item label="data">
                          <Address address={data["data"]} fontSize={15} />
                        </Descriptions.Item>

                        <Descriptions.Item label="signers">
                          {data["signers"].map((signerAddress, index) => {
                            return (
                              <React.Fragment key={index}>
                                <Address address={signerAddress} fontSize={15} />
                              </React.Fragment>
                            );
                          })}
                        </Descriptions.Item>
                        <Descriptions.Item label="status">{data["status"]}</Descriptions.Item>
                        <Descriptions.Item label="created at">{data["createdAt"]}</Descriptions.Item>
                        {/* <Descriptions.Item label="executed at">{data["executedAt"]}</Descriptions.Item> */}
                        <Descriptions.Item label="Created by">
                          <Address address={data["createdBy"]} fontSize={15} />
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>
                </Panel>
              );
            })}
        </Collapse>
      </>

      {queueList.length === 0 && <Empty />}
    </div>
  );
};

export default TranscationPool;
