import { Collapse, Descriptions, Divider, Empty } from "antd";
import axios from "axios";
import React from "react";

import { usePoller } from "eth-hooks";
import { useEffect } from "react";

import { useState } from "react";
import { ethers } from "ethers";

import { Address, Balance } from "..";
import { useStore } from "../../store/useStore";
import { TX_TYPES } from "../../constants";

const { Panel } = Collapse;

const TranscationHistory = () => {
  const [queueList, setQueueList] = useState([]);
  const [state, dispatch] = useStore();

  const { nonce, BACKEND_URL, targetNetwork, selectedWalletAddress, price } = state;

  const loadTxPoolList = async () => {
    try {
      const result = await axios.get(
        `${BACKEND_URL}/getPool/${targetNetwork.chainId}/${selectedWalletAddress}/${nonce?.toString()}/ALL`,
      );
      const { data } = result.data;
      setQueueList(data);
    } catch (error) {
      console.log(`n-🔴 => loadTxPoolList => error`, error);
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

  return (
    <div>
      <>
        <Collapse defaultActiveKey={["1"]} bordered={false}>
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
                        <Balance
                          balance={data["amount"] ? ethers.utils.parseEther(String(data["amount"])) : 0}
                          dollarMultiplier={price}
                          size={15}
                        />
                      </div>
                      <div>{data["createdAt"]}</div>
                      <div className={`${data["status"] === "success" ? "text-green-500" : "text-red-600"}`}>
                        {data["status"]}
                      </div>
                    </div>
                  }
                >
                  <div className="flex flex-col">
                    <div className="flex justify-start">
                      <div className="m-2  underline text-green-700">
                        {data["type"] === TX_TYPES.SAFE_APP ? data["url"] : data["type"]}
                      </div>
                      <div className="m-2 font-bold">
                        {/* {Number(data["amount"]).toFixed(4)} */}
                        <Balance
                          balance={data["amount"] ? ethers.utils.parseEther(String(data["amount"])) : 0}
                          dollarMultiplier={price}
                          size={15}
                        />
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
                        <Descriptions.Item label="Status">{data["status"]}</Descriptions.Item>
                        <Descriptions.Item label="Created at">{data["createdAt"]}</Descriptions.Item>
                        <Descriptions.Item label="Created by">
                          <Address address={data["createdBy"]} fontSize={15} />
                        </Descriptions.Item>

                        <Descriptions.Item label="Executed at">{data["executedAt"]}</Descriptions.Item>
                        <Descriptions.Item label="Executed by">
                          <Address address={data["executedBy"]} fontSize={15} />
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>
                </Panel>
              );
            })}
        </Collapse>

        {queueList.length === 0 && <Empty />}
      </>
    </div>
  );
};

export default TranscationHistory;
