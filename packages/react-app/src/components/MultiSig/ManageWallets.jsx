import React from "react";
import { List, Avatar, Card, Button } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

import { useStore } from "../../store/useStore";
import { Blockie, Address, Balance } from "..";

const ManageWallets = () => {
  const [store, dispatch] = useStore();
  const {
    address,
    readContracts,
    localProvider,
    factoryContractName,
    walletContractName,
    selectedWalletAddress,
    onChangeWallet,
    refreshToggle,
    setRefreshToggle,
    walletData,
    setWalletData,
    targetNetwork,
    multiSigWalletABI,
    importedWalletList,
    userWallets,
    price,
    setUserWallets,
    hiddenWalletList,
    setHiddenWalletList,
  } = store;

  const wallets = [
    ...userWallets.map(data => {
      return data.args;
    }),
  ];

  const onToggle = contractAddress => {
    const isExist = hiddenWalletList.includes(contractAddress);
    if (!isExist) {
      setHiddenWalletList([...new Set([...hiddenWalletList, contractAddress])]);
    }

    if (isExist) {
      setHiddenWalletList([
        ...new Set([...hiddenWalletList.filter(walletAddress => walletAddress !== contractAddress)]),
      ]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Card title="" className="w-1/2">
        <List
          itemLayout="vertical"
          dataSource={wallets}
          renderItem={item => (
            <List.Item
              extra={
                <Button
                  shape="circle"
                  type="ghost"
                  icon={
                    hiddenWalletList.includes(item.contractAddress) === false ? (
                      <EyeOutlined />
                    ) : (
                      <EyeInvisibleOutlined />
                    )
                  }
                  onClick={() => onToggle(item.contractAddress)}
                />
              }
            >
              <List.Item.Meta
                title={item.name}
                // description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                description={
                  <div className="flex justify-start">
                    <Address address={item.contractAddress} fontSize={15} />
                    <div className="ml-4">
                      <Balance price={price} address={item.contractAddress} provider={localProvider} size={15} />
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default ManageWallets;
