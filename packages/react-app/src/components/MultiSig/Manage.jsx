import React from "react";
import { Select, Typography } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";

import { useStore } from "../../store/useStore";
import useLocalStorage from "../../hooks/useLocalStorage";

export default function Manage() {
  //   const [hiddenWallets, setHiddenWallets] = useLocalStorage("hiddenWallets", []);
  //   console.log(`n-🔴 => Manage => hiddenWallets`, hiddenWallets);
  const [state, dispatch] = useStore();

  const {
    userWallets,
    currentMultiSigAddress,
    handleMultiSigChange,
    hideWalletItem,
    walletParams,
    onUnhideWallet,
    hiddenWallets,
  } = state;

  //   const selectedWallet = userWallets?.find(data => data.walletAddress === currentMultiSigAddress);

  return (
    <div className="">
      <Typography.Title level={5}>Manage multisig</Typography.Title>
      <div className="flex justify-center items-center">
        {/* <div className="w-1/4 m-2">
          <div>Select wallet</div>
          <Select
            className="w-full"
            value={currentMultiSigAddress}
            onChange={handleMultiSigChange}
            key={userWallets && userWallets.length}
            disabled={walletParams !== undefined}
          >
            {userWallets &&
              userWallets.length > 0 &&
              userWallets.map((data, index) => {
                return (
                  <Select.Option key={index} value={data.walletAddress}>
                    <div className="flex justify-between items-center">
                      <div>{data.walletName.slice(0, 14) + "..."}</div>
                      {walletParams === undefined && (
                        <>
                          <MinusCircleOutlined
                            onClick={e => hideWalletItem(e, data.walletName, data.walletAddress)}
                            style={{ color: "red" }}
                          />
                        </>
                      )}
                    </div>
                  </Select.Option>
                );
              })}
          </Select>
        </div> */}
        <div className="w-1/4 m-2">
          <div>Hidden wallets</div>
          <Select className="w-full" key={hiddenWallets && hiddenWallets.length}>
            {hiddenWallets &&
              hiddenWallets.length > 0 &&
              hiddenWallets.map((data, index) => {
                return (
                  <Select.Option key={index} value={data.walletName}>
                    <div className="flex justify-between items-center">
                      <div>{data.walletName}</div>
                      <>
                        <PlusCircleOutlined
                          onClick={e => onUnhideWallet(e, data.walletAddress)}
                          style={{ color: "green" }}
                        />
                      </>
                    </div>
                  </Select.Option>
                );
              })}
          </Select>
        </div>
      </div>
    </div>
  );
}
