import { Tabs } from "antd";
import React, { useState } from "react";
import { ManageWallets, ManageOwners, ImportWallets } from "../components";

const Manage = () => {
  const [activeTab, setActiveTab] = useState("safeApp");

  return (
    <div>
      <Tabs
        // type="card"
        defaultActiveKey="mangeOwners"
        // activeKey={activeTab}
        // onChange={key => {
        //   setActiveTab(key);
        // }}
        items={[
          {
            label: "Manage Owners",
            key: "mangeOwners",
            children: (
              <>
                <ManageOwners />
              </>
            ),
          },

          {
            label: "Import wallet",
            key: "importWaltet",
            children: (
              <>
                {" "}
                <ImportWallets />
              </>
            ),
          },

          {
            label: "Manage wallets",
            key: "manageWalets",
            children: (
              <>
                <ManageWallets />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Manage;
