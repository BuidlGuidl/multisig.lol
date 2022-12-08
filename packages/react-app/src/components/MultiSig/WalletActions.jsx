import { MinusCircleOutlined } from "@ant-design/icons";
import { Select } from "antd";

import { NETWORKS, Sleep } from "../../constants";

import { CreateMultiSigModal, ImportMultiSigModal } from "../index";

import { useEffect } from "react";
import { useStore } from "../../store/useStore";

const { Option } = Select;

const WalletActions = () => {
  const selectNetworkOptions = [];
  for (const id in NETWORKS) {
    selectNetworkOptions.push(
      <Select.Option key={id} value={NETWORKS[id].name}>
        <span style={{ color: NETWORKS[id].color }}>{NETWORKS[id].name}</span>
      </Select.Option>,
    );
  }

  const [state, dispatch] = useStore();
  const {
    address,
    reDeployWallet,
    price,
    selectedChainId,
    mainnetProvider,
    setReDeployWallet,
    BACKEND_URL,
    tx,
    writeContracts,
    isCreateModalVisible,
    setIsCreateModalVisible,
    getUserWallets,
    targetNetwork,
    isFactoryDeployed,
    multiSigWalletABI,
    localProvider,
    userWallets,
    setSelectedWalletAddress,
    onChangeNetwork,
    currentMultiSigAddress,
    handleMultiSigChange,
    hideWalletItem,
    walletParams,
  } = state;

  const loadWallet = async () => {
    if (walletParams && walletParams.networkName in NETWORKS) {
      onChangeNetwork(walletParams.networkName);
      await Sleep(1000);
      handleMultiSigChange(walletParams.walletAddress);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [walletParams]);

  return (
    <>
      <div key={address} className="flex justify-start items-center p-2 my-2  flex-wrap ">
        <div>
          <CreateMultiSigModal
            key={address}
            reDeployWallet={reDeployWallet}
            setReDeployWallet={setReDeployWallet}
            poolServerUrl={BACKEND_URL}
            price={price}
            selectedChainId={selectedChainId}
            mainnetProvider={mainnetProvider}
            address={address}
            tx={tx}
            writeContracts={writeContracts}
            contractName={"MultiSigFactory"}
            isCreateModalVisible={isCreateModalVisible}
            setIsCreateModalVisible={setIsCreateModalVisible}
            getUserWallets={getUserWallets}
            currentNetworkName={targetNetwork.name}
            isFactoryDeployed={isFactoryDeployed}
          />
        </div>

        <div className="m-2  w-16">
          <ImportMultiSigModal
            mainnetProvider={mainnetProvider}
            targetNetwork={targetNetwork}
            networkOptions={selectNetworkOptions}
            // multiSigs={multiSigs}
            // setMultiSigs={setMultiSigs}
            // setCurrentMultiSigAddress={setCurrentMultiSigAddress}
            multiSigWalletABI={multiSigWalletABI}
            localProvider={localProvider}
            // poolServerUrl={BACKEND_URL}
            userWallets={userWallets}
            getUserWallets={getUserWallets}
            isFactoryDeployed={isFactoryDeployed}
            setSelectedWalletAddress={setSelectedWalletAddress}
            walletParams={walletParams}
          />
        </div>
        <div className="m-2  w-32">
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
                  <Option key={index} value={data.walletAddress}>
                    <div className="flex justify-between items-center">
                      <div>{data.walletName.slice(0, 14) + "..."}</div>
                      {walletParams === undefined && (
                        <>
                          <MinusCircleOutlined
                            onClick={e => hideWalletItem(e, data.walletAddress)}
                            style={{ color: "red" }}
                          />
                        </>
                      )}
                    </div>
                  </Option>
                );
              })}
          </Select>
        </div>
        <div className="m-2  w-28 ">
          {/* {networkSelect} */}

          <Select
            className="w-full text-left"
            // defaultValue={targetNetwork.name}
            value={targetNetwork.name}
            // style={{ textAlign: "left", width: 170 }}
            onChange={onChangeNetwork}
          >
            {selectNetworkOptions}
          </Select>
        </div>
      </div>
    </>
  );
};

export default WalletActions;
