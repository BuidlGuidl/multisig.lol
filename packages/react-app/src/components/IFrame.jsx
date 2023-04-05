import { useState, useEffect } from "react";
import { Input, Button, Spin, Row, Col, Modal } from "antd";
import axios from "axios";
import { useSafeInject } from "../contexts/SafeInjectContext";
import TransactionDetailsModal from "./MultiSig/TransactionDetailsModal";
import { NETWORKS } from "../constants";
import { parseExternalContractTransaction } from "../helpers";

export default function IFrame({
  address,
  loadTransactionData,
  mainnetProvider,
  price,
  isTxLoaded,
  customNonce,
  setCustomNonce,
}) {
  const cachedNetwork = window.localStorage.getItem("network");
  let targetNetwork = NETWORKS[cachedNetwork || "mainnet"];

  const { setAddress, appUrl, setAppUrl, setRpcUrl, iframeRef, newTx, setNewTx } = useSafeInject();

  const [isIFrameLoading, setIsIFrameLoading] = useState(false);
  const [inputAppUrl, setInputAppUrl] = useState();
  const [tx, setTx] = useState();
  const [parsedTransactionData, setParsedTransactionData] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSafeDappsOpen, setIsSafeDappsOpen] = useState(false);
  const [safeDapps, setSafeDapps] = useState({});
  const [searchSafeDapp, setSearchSafeDapp] = useState();
  const [filteredSafeDapps, setFilteredSafeDapps] = useState();
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    setAddress(address);
    setRpcUrl(targetNetwork.rpcUrl);
  }, []);

  useEffect(() => {
    setInputAppUrl("https://app.uniswap.org/#/swap");
    setAppUrl("https://app.uniswap.org/#/swap");
    setIsIFrameLoading(true);
  }, []);

  useEffect(() => {
    const fetchSafeDapps = async chainId => {
      const response = await axios.get(`https://safe-client.gnosis.io/v1/chains/${ chainId }/safe-apps`);
      setSafeDapps(dapps => ({
        ...dapps,
        [chainId]: response.data.filter(d => ![29, 11].includes(d.id)), // Filter out Transaction Builder and WalletConnect
      }));
    };

    if (isSafeDappsOpen && !safeDapps[targetNetwork.chainId]) {
      fetchSafeDapps(targetNetwork.chainId);
    }
  }, [isSafeDappsOpen, safeDapps, targetNetwork]);

  useEffect(() => {
    if (safeDapps[targetNetwork.chainId]) {
      setFilteredSafeDapps(
        safeDapps[targetNetwork.chainId].filter(dapp => {
          if (!searchSafeDapp) return true;

          return (
            dapp.name.toLowerCase().indexOf(searchSafeDapp.toLocaleLowerCase()) !== -1 ||
            dapp.url.toLowerCase().indexOf(searchSafeDapp.toLocaleLowerCase()) !== -1
          );
        }),
      );
    } else {
      setFilteredSafeDapps(undefined);
    }
  }, [safeDapps, targetNetwork, searchSafeDapp]);

  useEffect(() => {
    if (newTx) {
      setTx(newTx);
    }
  }, [newTx]);

  useEffect(() => {
    if (tx) {
      decodeFunctionData();
    }
  }, [tx]);

  useEffect(() => {
    if (tx) {
      decodeFunctionData();
    }
  }, [tx]);

  useEffect(() => {
    if (isTxLoaded) {
      hideModal();
    }
  }, [isTxLoaded]);

  const decodeFunctionData = async () => {
    try {
      const parsedTransactionData = await parseExternalContractTransaction(tx.to, tx.data);
      setParsedTransactionData(parsedTransactionData);
      setIsModalVisible(true);
    } catch (error) {
      console.log(error);
      setParsedTransactionData(null);
    }
  };

  const hideModal = () => setIsModalVisible(false);
  const onRefresh = () => setRefresh(!refresh);

  const handleOk = () => {
    loadTransactionData({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      isIframe: true,
    });
    setNewTx(false);
  };

  return (
    <div className="flex flex-col items-center">
      <Button onClick={() => setIsSafeDappsOpen(true)}>Select from supported dapps</Button>
      <Modal
        title="Select a dapp"
        visible={isSafeDappsOpen}
        onCancel={() => setIsSafeDappsOpen(false)}
        footer={null}
        destroyOnClose
        closable
        maskClosable
      >
        <div
          style={{
            minHeight: "30rem",
            maxHeight: "30rem",
            overflow: "scroll",
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          {!safeDapps ||
            (!safeDapps[targetNetwork.chainId] && (
              <div>
                <Spin />
              </div>
            ))}
          <div
            style={{
              paddingBottom: "2rem",
              paddingLeft: "2rem",
              paddingRight: "2rem",
            }}
          >
            {safeDapps && safeDapps[targetNetwork.chainId] && (
              <div
                style={{
                  paddingBottom: "1.5rem",
                }}
              >
                <Input
                  placeholder="search 🔎"
                  style={{ maxWidth: "30rem" }}
                  value={searchSafeDapp}
                  onChange={e => setSearchSafeDapp(e.target.value)}
                />
              </div>
            )}
            <Row gutter={[16, 16]}>
              {filteredSafeDapps &&
                filteredSafeDapps.map((dapp, i) => (
                  <Col
                    key={i}
                    className="gutter-row"
                    span={8}
                    style={{
                      maxWidth: "140px",
                    }}
                  >
                    <Button
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "1rem",
                        height: "100%",
                        width: "100%",
                        borderRadius: "10px",
                      }}
                      onClick={() => {
                        setAppUrl(dapp.url);
                        setInputAppUrl(dapp.url);
                        setIsSafeDappsOpen(false);
                      }}
                    >
                      <img
                        src={dapp.iconUrl}
                        alt={dapp.name}
                        style={{
                          width: "2rem",
                          borderRadius: "full",
                        }}
                      />
                      <div
                        style={{
                          marginTop: "0.5rem",
                          textAlign: "center",
                          width: "6rem",
                          overflow: "hidden",
                        }}
                      >
                        {dapp.name}
                      </div>
                    </Button>
                  </Col>
                ))}
            </Row>
          </div>
        </div>
      </Modal>
      <Input
        placeholder="custom dapp URL"
        style={{
          marginTop: 16,
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
        <div className="flex flex-col items-end">
          <Button className="mt-2" onClick={onRefresh}>
            refresh
          </Button>
          <iframe
            key={refresh}
            title="app"
            src={appUrl}
            width="1200rem"
            height="900rem"
            style={{
              marginTop: "1rem",
            }}
            ref={iframeRef}
            onLoad={() => setIsIFrameLoading(false)}
          />
        </div>
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
          to={tx.to}
          value={tx.value}
          type="IFrame"
          customNonce={customNonce}
          setCustomNonce={setCustomNonce}
        />
      )}
    </div>
  );
}
