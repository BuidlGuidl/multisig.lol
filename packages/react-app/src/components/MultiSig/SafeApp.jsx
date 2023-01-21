import { Tabs, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { TranscactionPool } from "..";
import { TX_TYPES } from "../../constants";
import { useSafeInject } from "../../store/SafeInjectProvider";
import ConfirmTxModal from "./ConfirmTxModal";

const SafeIframe = ({ setActiveTab }) => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const {
    state: { url },
  } = useLocation();
  const { setAddress, appUrl, setAppUrl, setRpcUrl, iframeRef, newTx, setNewTx } = useSafeInject();
  console.log(`n-🔴 => SafeIframe => iframeRef`, iframeRef);

  const onClose = () => {
    setNewTx(undefined);
  };

  useEffect(() => {
    if (iframeRef) {
      setIsAppLoading(false);
    }
  }, [iframeRef]);

  return (
    <>
      {url && (
        <div className="flex justify-center mt-16">
          <iframe title="app" src={url} className="w-full h-screen" ref={iframeRef} />
          {isAppLoading && <Spin size="large" />}
        </div>
      )}

      {newTx && (
        <ConfirmTxModal
          isOpen={newTx ? true : false}
          onClose={onClose}
          type={TX_TYPES.SAFE_APP}
          from={newTx["from"]}
          to={newTx["to"]}
          amount={newTx["value"]}
          callData={newTx["data"]}
          gas={newTx["gas"]}
          url={url}
          setActiveTab={setActiveTab}
        />
      )}
    </>
  );
};

const SafeApp = () => {
  const [activeTab, setActiveTab] = useState("safeApp");

  const {
    state: { url },
  } = useLocation();

  return (
    <div>
      <Tabs
        type="card"
        defaultActiveKey="1"
        activeKey={activeTab}
        onChange={key => {
          setActiveTab(key);
        }}
        items={[
          {
            label: url,
            key: "safeApp",
            children: (
              <>
                <SafeIframe setActiveTab={setActiveTab} />
              </>
            ),
          },

          {
            label: "Transcaction pool",
            key: "transcactionPool",
            children: (
              <>
                <TranscactionPool />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SafeApp;
