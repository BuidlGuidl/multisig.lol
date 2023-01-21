import React from "react";
import { Card, Tabs } from "antd";
import ProposeActions from "../components/MultiSig/ProposeActions";
import { TX_TYPES } from "../constants";

const NewTranscaction = () => {
  return (
    <>
      <div className="w-full flex flex-col items-center">
        <Card title="Propose new transcaction" className="w-1/2">
          <Tabs
            defaultActiveKey="1"
            centered
            size="middle"
            items={[
              {
                label: "Send Eth",
                key: "sendEth",
                children: <ProposeActions type={TX_TYPES.SEND_ETH} />,
              },

              {
                label: "Custom call",
                key: "customCall",
                children: <ProposeActions type={TX_TYPES.CUSTOM_CALL} />,
              },

              //       {
              //         label: "Wallet connect",
              //         key: "walletConnect",
              //         children: <ProposeActions type={"walletConnect"} />,
              //       },
            ]}
          />
        </Card>
      </div>
    </>
  );
};

export default NewTranscaction;
