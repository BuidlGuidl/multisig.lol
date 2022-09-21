import { useState, useEffect } from "react";
import { Input, Button, Spin } from "antd";
import { useSafeInject } from "../contexts/SafeInjectContext";
import TransactionDetailsModal from "./MultiSig/TransactionDetailsModal";
import { NETWORKS } from "../constants";
import { parseExternalContractTransaction } from "../helpers";

export default function IFrame({ address, loadTransactionData, mainnetProvider, price }) {
  const cachedNetwork = window.localStorage.getItem("network");
  let targetNetwork = NETWORKS[cachedNetwork || "mainnet"];

  const { setAddress, appUrl, setAppUrl, setRpcUrl, iframeRef, newTx } = useSafeInject();

  const [isIFrameLoading, setIsIFrameLoading] = useState(false);
  const [inputAppUrl, setInputAppUrl] = useState();
  const [to, setTo] = useState();
  const [data, setData] = useState();
  const [value, setValue] = useState();
  const [parsedTransactionData, setParsedTransactionData] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    setAddress(address);
    setRpcUrl(targetNetwork.rpcUrl);
  }, []);

  useEffect(() => {
    if (newTx) {
      setTo(newTx.to);
      setData(newTx.data);
      setValue(newTx.value);
    }
  }, [newTx]);

  useEffect(() => {
    // if (data && to) {
    if (to) {
      decodeFunctionData();
    }
  }, [data]);

  const decodeFunctionData = async () => {
    try {
      const parsedTransactionData = await parseExternalContractTransaction(newTx.to, newTx.data);
      // console.log("n-parsedTransactionData: ", parsedTransactionData);
      setParsedTransactionData(parsedTransactionData);
      setIsModalVisible(true);
    } catch (error) {
      console.log(error);
      setParsedTransactionData(null);
    }
  };

  const hideModal = () => setIsModalVisible(false);

  const handleOk = () => {
    loadTransactionData({
      to,
      value,
      data,
    });
  };

  return (
    <div className="flex flex-col items-center">
      <Input
        placeholder="dapp URL"
        style={{
          minWidth: "18rem",
          maxWidth: "20rem",
        }}
        autoFocus={true}
        value={inputAppUrl}
        onChange={e => setInputAppUrl(e.target.value)}
      />
      <Button
        type={"primary"}
        style={{
          marginTop: "1rem",
          maxWidth: "8rem",
        }}
        onClick={() => {
          setAppUrl(inputAppUrl);
          setIsIFrameLoading(true);
        }}
      >
        {isIFrameLoading ? <Spin /> : "Load"}
      </Button>
      {appUrl && (
        <iframe
          title="app"
          src={appUrl}
          width="1000rem"
          height="500rem"
          style={{
            marginTop: "1rem",
          }}
          ref={iframeRef}
          onLoad={() => setIsIFrameLoading(false)}
        />
      )}
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
          type="IFrame"
        />
      )}
    </div>
  );
}
