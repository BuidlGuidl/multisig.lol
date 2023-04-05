import { MinusCircleOutlined } from "@ant-design/icons";
import { Select, Button } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

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
  console.log(`n-🔴 => WalletActions => address:`, address);

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
            // key={address}
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
            options={
              userWallets &&
              userWallets.length > 0 && [
                ...userWallets.map(item => ({
                  value: item.walletAddress,
                  label: item.walletName,
                })),
              ]
            }
          >
            {/* {userWallets &&
              userWallets.length > 0 &&
              userWallets.map((data, index) => {
                return (
                  <Select.Option key={data.walletAddress} value={data.walletAddress}>
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
              })} */}
          </Select>
        </div>

        {/* old network select */}
        {/* <div className="m-2  w-28 ">
          <Select className="w-full text-left" value={targetNetwork.name} onChange={onChangeNetwork}>
            {selectNetworkOptions}
          </Select>
        </div> */}
        {/* <div className="flex items-center">
          <Link to={"/manage"}>
            <Button icon={<SettingOutlined />}>Manage</Button>
          </Link>
        </div> */}
      </div>
    </>
  );
};

export default WalletActions;
