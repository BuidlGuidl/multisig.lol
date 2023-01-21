import React, { useEffect, useState } from "react";
import { Card, Input, Select, Button, Spin, Alert, message } from "antd";
import { ethers } from "ethers";

import AddressInput from "../AddressInput";
import { useStore } from "../../store/useStore";
import { NETWORKS } from "../../constants";

const getFactoryVersion = async contract => {
  try {
    // get the factory version
    const factoryVersion = await contract.factoryVersion();
    return Number(factoryVersion.toString());
  } catch (error) {
    // console.log("n-error: ", error);
    // if no factory version variable that mean its version zero
    console.log("its older factory version !!");
    return 0;
  }
};

const ImportWallets = () => {
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
    mainnetProvider,
    multiSigWalletABI,
    importedWalletList,
    setImportedWalletList,
  } = store;
  // console.log(`n-🔴 => ImportWallets => importedWalletList`, importedWalletList);

  const [walletAddress, setWalletAddress] = useState(undefined);
  //     const [walletName, setWalletName] = useState(undefined);
  //   const [importedMultiSigs, setImportedMultiSigs] = useLocalStorage("importedMultiSigs");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [error, setError] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  //   const [address, setAddress] = useState();
  const [walletName, setWalletName] = useState("");
  const [loadingWalletName, setLoadingWalletName] = useState(false);
  const [factoryVersion, setFactoryVersion] = useState(undefined);
  const [network, setNetwork] = useState(targetNetwork.name);

  const selectNetworkOptions = [];
  for (const id in NETWORKS) {
    selectNetworkOptions.push(
      <Select.Option key={id} value={NETWORKS[id].name}>
        <span style={{ color: NETWORKS[id].color }}>{NETWORKS[id].name}</span>
      </Select.Option>,
    );
  }
  const checkDuplicateWallet = address => {
    //     let isExists = userWallets.find(data => data.walletAddress === address);
    //     if (isExists) {
    //       setDuplicateError(true);
    //     }
  };

  const onEnterWalletAddress = async address => {
    try {
      address = walletAddress;
      console.log(`n-🔴 => onEnterWalletAddress => address`, address);
      if (ethers.utils.isAddress(address)) {
        setError(false);
        setLoadingWalletName(true);
        const contract = new ethers.Contract(address, multiSigWalletABI, localProvider);

        let factoryVersion = await getFactoryVersion(contract);
        console.log(`n-🔴 => onEnterWalletAddress => factoryVersion`, factoryVersion);
        setFactoryVersion(factoryVersion);

        if (factoryVersion === 1) {
          const walletName = await contract.name();
          console.log(`n-🔴 => onEnterWalletAddress => walletName`, walletName);
          setWalletName(walletName);
        }
        if (factoryVersion === 0) {
          throw new Error("cant find wallet");
        }

        setLoadingWalletName(false);
        checkDuplicateWallet(address);
      } else {
        setWalletName("");
        setError(true);
      }
    } catch (error) {
      console.log(`n-🔴 => onEnterWalletAddress => error`, error);
      setWalletName("");
      setLoadingWalletName(false);
      setError(true);
    }
  };

  const onImport = () => {
    setImportedWalletList([...new Set([...importedWalletList, walletAddress])]);
    setRefreshToggle(!refreshToggle);
    message.info("imported wallet");
  };

  useEffect(() => {
    if (walletAddress) {
      onEnterWalletAddress();
    }
  }, [walletAddress]);

  return (
    <div className="flex flex-col items-center">
      <Card
        title="Import wallets"
        className="w-1/2"
        actions={[
          <Button type="primary" onClick={onImport} disabled={!walletAddress}>
            Import
          </Button>,
        ]}
      >
        <div className="m-2">
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder={"Multisig address"}
            value={walletAddress}
            onChange={setWalletAddress}
          />
        </div>

        <div className="m-2">
          <Input
            placeholder="Enter wallet name"
            value={walletName}
            onChange={event => setWalletName(event.target.value)}
            suffix={loadingWalletName && <Spin spinning />}
            disabled={error || duplicateError}
          />
        </div>

        <div className="m-2">
          <Select defaultValue={targetNetwork.name} onChange={value => setNetwork(value)} style={{ width: "100%" }}>
            {selectNetworkOptions}
          </Select>
        </div>
        {error && <Alert message="Unable to import: this doesn't seem like a multisig." type="error" showIcon />}
        {duplicateError && <Alert message="Wallet already present ! " type="error" showIcon />}
      </Card>
    </div>
  );
};
export default ImportWallets;
