import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Button, Input, Select, InputNumber, Space, Tooltip, Alert } from "antd";
import { CodeOutlined } from "@ant-design/icons";
import { AddressInput, EtherInput, WalletConnectInput, IFrame } from "../components";
import TransactionDetailsModal from "../components/MultiSig/TransactionDetailsModal";
import { parseExternalContractTransaction } from "../helpers";
import { useLocalStorage } from "../hooks";
import { ethers } from "ethers";
import { parseEther } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
const { Option } = Select;

const axios = require("axios");

export default function CreateTransaction({
  poolServerUrl,
  contractName,
  contractAddress,
  mainnetProvider,
  localProvider,
  price,
  readContracts,
  userSigner,
  nonce,
  signaturesRequired,
}) {
  const history = useHistory();
  const [methodName, setMethodName] = useLocalStorage("methodName", "transferFunds");
  const [newSignaturesRequired, setNewSignaturesRequired] = useState(signaturesRequired);
  const [amount, setAmount] = useState("0");
  const [to, setTo] = useLocalStorage("to");
  const [customCallData, setCustomCallData] = useState("");
  const [parsedCustomCallData, setParsedCustomCallData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldCreateTransaction, setShouldCreateTransaction] = useState(false);
  const [isOwner, setIsOwner] = useState();
  const [isIframe, setIsIframe] = useState(false);
  const [isTxLoaded, setIsTxLoaded] = useState(false);

  const [hasEdited, setHasEdited] = useState(); //we want the signaturesRequired to update from the contract _until_ they edit it
  const [customNonce, setCustomNonce] = useState(nonce);
  const [cancelTxNonce, setCancelTxNonce] = useState(nonce);

  useEffect(() => {
    if (!hasEdited) {
      setNewSignaturesRequired(signaturesRequired);
    }
  }, [signaturesRequired]);

  useLayoutEffect(() => {
    setCustomNonce(nonce);
    setCancelTxNonce(nonce);
  }, [nonce]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const inputStyle = {
    padding: 10,
  };

  useEffect(() => {
    const getParsedTransaction = async () => {
      const parsedTransaction = await parseExternalContractTransaction(to, customCallData);
      setParsedCustomCallData(parsedTransaction);
    };

    getParsedTransaction();
  }, [customCallData]);

  const loadTransactionData = ({ to, value, data, isIframe = false }) => {
    setTo(to);
    value ? setAmount(ethers.utils.formatEther(value)) : setAmount("0");
    setCustomCallData(data);
    setShouldCreateTransaction(true);
    if (isIframe) {
      setIsIframe(true);
    }
  };

  useEffect(() => {
    shouldCreateTransaction && createTransaction();
    setShouldCreateTransaction(false);
  }, [shouldCreateTransaction]);

  const createTransaction = async () => {
    try {
      //a little security in the frontend just because
      if (newSignaturesRequired < 1) {
        alert("signatures required must be >= 1");
      } else {
        setLoading(true);

        let callData;
        let executeToAddress;
        if (
          methodName === "transferFunds" ||
          methodName === "customCallData" ||
          methodName === "wcCallData" ||
          methodName === "iframeCallData" ||
          methodName == "cancelPendingTx"
        ) {
          callData = methodName == "transferFunds" || methodName == "cancelPendingTx" ? "0x" : customCallData;
          executeToAddress = methodName == "cancelPendingTx" ? contractAddress : to;
        } else {
          callData = readContracts[contractName]?.interface?.encodeFunctionData(methodName, [
            to,
            newSignaturesRequired,
          ]);
          executeToAddress = contractAddress;
        }
        const newHash =
          methodName == "cancelPendingTx"
            ? await readContracts[contractName].getTransactionHash(
                cancelTxNonce,
                executeToAddress,
                parseEther("" + parseFloat(0).toFixed(12)),
                callData,
              )
            : await readContracts[contractName].getTransactionHash(
                customNonce,
                executeToAddress,
                parseEther("" + parseFloat(amount).toFixed(12)),
                callData,
              );

        const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));

        const recover = await readContracts[contractName].recover(newHash, signature);

        const isOwner = await readContracts[contractName].isOwner(recover);
        setIsOwner(isOwner);

        if (isOwner) {
          const res =
            methodName == "cancelPendingTx"
              ? await axios.post(poolServerUrl, {
                  chainId: localProvider._network.chainId,
                  address: readContracts[contractName]?.address,
                  nonce: cancelTxNonce,
                  to: executeToAddress,
                  amount: "0",
                  data: callData,
                  hash: newHash,
                  signatures: [signature],
                  signers: [recover],
                })
              : await axios.post(poolServerUrl, {
                  chainId: localProvider._network.chainId,
                  address: readContracts[contractName]?.address,
                  nonce: customNonce,
                  to: executeToAddress,
                  amount,
                  data: callData,
                  hash: newHash,
                  signatures: [signature],
                  signers: [recover],
                });

          if (isIframe) {
            setLoading(prev => false);
            setIsTxLoaded(prev => true);
            setTimeout(() => {
              let hostURL = window.location.origin;
              window.open(`${hostURL}/pool`, "_blank");

              setIsTxLoaded(prev => false);
              return;
            }, 1000);
          }

          if (isIframe === false) {
            setTimeout(() => {
              history.push("/pool");
              setLoading(false);
            }, 1000);
          }
        } else {
          console.log("ERROR, NOT OWNER.");
          setLoading(false);
        }
      }
    } catch (error) {
      console.log("n-Error: ", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center flex-col items-center">
      <div
        // style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}
        className="flex justify-center border-2 m-5 rounded-2xl shadow-md"
        style={{
          minWidth: "24rem",
        }}
      >
        <div className="flex flex-col items-center" style={{ margin: 8 }}>
          <div style={{ margin: 8, padding: 8, width: "10rem", maxWidth: "15rem" }}>
            <Select value={methodName} style={{ width: "100%" }} onChange={setMethodName}>
              <Option key="transferFunds">Send ETH</Option>
              <Option key="addSigner">Add Signer</Option>
              <Option key="removeSigner">Remove Signer</Option>
              <Option key="customCallData">Custom Call Data</Option>
              <Option key="wcCallData">
                {/* <img src="walletconnect-logo.svg" style={{ height: 20, width: 20 }} /> WalletConnect */}
                WalletConnect
              </Option>
              <Option key="iframeCallData">IFrame</Option>
              <Option key="cancelPendingTx">Cancel Pending Tx</Option>
            </Select>
          </div>
          {methodName === "wcCallData" ? (
            <div style={inputStyle}>
              <WalletConnectInput
                chainId={localProvider?._network.chainId}
                address={contractAddress}
                loadTransactionData={loadTransactionData}
                mainnetProvider={mainnetProvider}
                price={price}
              />
            </div>
          ) : methodName === "iframeCallData" ? (
            <IFrame
              address={contractAddress}
              loadTransactionData={loadTransactionData}
              mainnetProvider={mainnetProvider}
              price={price}
              isTxLoaded={isTxLoaded}
              customNonce={customNonce}
              setCustomNonce={setCustomNonce}
            />
          ) : (
            <>
              {methodName != "cancelPendingTx" && (
                <div style={inputStyle}>
                  <AddressInput
                    autoFocus
                    ensProvider={mainnetProvider}
                    placeholder={methodName == "transferFunds" ? "Recepient address" : "Owner address"}
                    value={to}
                    onChange={setTo}
                  />
                </div>
              )}
              <div style={inputStyle}>
                {(methodName == "addSigner" || methodName == "removeSigner") && (
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder={"New # of signatures required"}
                    value={newSignaturesRequired}
                    onChange={value => {
                      setNewSignaturesRequired(value);
                      setHasEdited(true);
                    }}
                  />
                )}
                {methodName == "cancelPendingTx" && (
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder={"Enter Tx Nonce"}
                    onChange={value => {
                      if (value) {
                        setCancelTxNonce(BigNumber.from(value));
                      } else {
                        setCancelTxNonce(nonce);
                      }
                    }}
                  />
                )}
                {methodName == "customCallData" && (
                  <>
                    <Input.Group compact>
                      <Input
                        style={{ width: "calc(100% - 31px)", marginBottom: 20 }}
                        placeholder="Custom call data"
                        value={customCallData}
                        onChange={e => {
                          setCustomCallData(e.target.value);
                        }}
                      />
                      <Tooltip title="Parse transaction data">
                        <Button onClick={showModal} icon={<CodeOutlined />} />
                      </Tooltip>
                    </Input.Group>
                    <TransactionDetailsModal
                      visible={isModalVisible}
                      txnInfo={parsedCustomCallData}
                      handleOk={() => setIsModalVisible(false)}
                      handleCancel={() => setIsModalVisible(false)}
                      mainnetProvider={mainnetProvider}
                      price={price}
                    />
                  </>
                )}
                {(methodName == "transferFunds" || methodName == "customCallData") && (
                  <EtherInput
                    price={price}
                    mode="USD"
                    value={amount}
                    contractAddress={contractAddress}
                    onChange={setAmount}
                    provider={localProvider}
                  />
                )}
              </div>
              {/*

              pulling this for now 

              I think we will have the nonce edit in the propose page because everything will be a safe app that bubbles up to the propose 
              
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Leave blank for current nonce"
                defaultValue={nonce}
                onChange={value => {
                  setCustomNonce(value >= 0 ? value : 0);
                }}
              />*/}
              <Space style={{ marginTop: 32 }}>
                <Button
                  loading={loading}
                  disabled={cancelTxNonce > nonce && methodName === "cancelPendingTx"}
                  onClick={createTransaction}
                  type="primary"
                >
                  Propose
                </Button>
              </Space>
            </>
          )}
        </div>
      </div>

      {isOwner === false && <Alert message="you are not the owner ! " type="error" showIcon />}
    </div>
  );
}
