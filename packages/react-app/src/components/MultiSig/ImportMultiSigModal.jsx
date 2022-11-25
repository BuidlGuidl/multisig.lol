import React, { useState, useEffect } from "react";
import { Button, Modal, Select, Alert, Input, Spin } from "antd";
import { ethers } from "ethers";

import { useLocalStorage } from "../../hooks";

import { AddressInput } from "..";
import useDebounce from "../../hooks/useDebounce";
import useStore from "../../store/useStore";

export default function ImportMultiSigModal({
  mainnetProvider,
  targetNetwork,
  networkOptions,
  // multiSigs,
  // setMultiSigs,
  // setCurrentMultiSigAddress,
  multiSigWalletABI,
  localProvider,
  // poolServerUrl,
  userWallets,
  getUserWallets,
  isFactoryDeployed,
  setSelectedWalletAddress,
  walletParams,
}) {
  const [importedMultiSigs, setImportedMultiSigs] = useLocalStorage("importedMultiSigs");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [error, setError] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [address, setAddress] = useState();
  const [walletName, setWalletName] = useState("");
  const [loadingWalletName, setLoadingWalletName] = useState(false);
  const [factoryVersion, setFactoryVersion] = useState(undefined);
  const [network, setNetwork] = useState(targetNetwork.name);

  const walletAddressDebounce = useDebounce(address, 700);

  const resetState = () => {
    setError(false);
    setAddress("");
    setNetwork(targetNetwork.name);
    setPendingImport(false);
    setWalletName("");
  };

  const handleCancel = () => {
    resetState();
    setIsModalVisible(false);
  };
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

  const handleSubmit = async () => {
    try {
      setPendingImport(true);

      const contract = new ethers.Contract(address, multiSigWalletABI, localProvider);

      let signaturesRequired = await contract.signaturesRequired();
      signaturesRequired = signaturesRequired.toString();

      let owners = [];

      if (factoryVersion === 1) {
        let ownnersCount = await contract.numberOfOwners();
        ownnersCount = ownnersCount.toString();
        for (let index = 0; index < +ownnersCount; index++) {
          let owner = await contract.owners(index);
          owners.push(owner);
        }
      }

      let walletAddress = contract.address;

      let importWalletData = {
        walletName,
        walletAddress,
        chainIds: [targetNetwork.chainId],
        signaturesRequired: +signaturesRequired,
        owners,
      };

      let newImportedMultiSigs = importedMultiSigs || {};
      (newImportedMultiSigs[network] = newImportedMultiSigs[network] || []).push(importWalletData);
      newImportedMultiSigs[network] = [...new Set(newImportedMultiSigs[network])];
      setImportedMultiSigs(newImportedMultiSigs);

      await getUserWallets(true);

      resetState();
      setIsModalVisible(false);
      setSelectedWalletAddress(walletAddress);
      window.location.reload();
    } catch (e) {
      console.log("n-Import error:", e);
      setError(true);
      setPendingImport(false);
    }
  };

  const checkDuplicateWallet = address => {
    let isExists = userWallets.find(data => data.walletAddress === address);
    if (isExists) {
      setDuplicateError(true);
    }
  };

  const onEnterWalletAddress = async address => {
    try {
      if (ethers.utils.isAddress(address)) {
        setError(false);
        setLoadingWalletName(true);
        const contract = new ethers.Contract(address, multiSigWalletABI, localProvider);

        let factoryVersion = await getFactoryVersion(contract);
        setFactoryVersion(factoryVersion);

        if (factoryVersion === 1) {
          const walletName = await contract.name();
          setWalletName(walletName);
        }

        setLoadingWalletName(false);
        checkDuplicateWallet(address);
      } else {
        setWalletName("");
        setError(true);
      }
    } catch (error) {
      setWalletName("");
      setLoadingWalletName(false);
      setError(true);
    }
  };

  const onEnterWalletName = async event => {
    setWalletName(event.target.value);
  };

  const importURLWallet = async () => {
    if (walletParams && userWallets) {
      let isExists = userWallets.find(data => data.walletAddress === address);

      setIsModalVisible(isExists === undefined);
      setAddress(walletParams.walletAddress);
    }
  };

  useEffect(() => {
    if (walletAddressDebounce) {
      onEnterWalletAddress(walletAddressDebounce);
    }
  }, [walletAddressDebounce]);

  useEffect(() => {
    importURLWallet();
  }, [walletParams, userWallets]);

  return (
    <>
      <Button
        type="primary"
        ghost
        onClick={() => setIsModalVisible(true)}
        disabled={isFactoryDeployed === undefined || walletParams !== undefined}
      >
        Import
      </Button>
      <Modal
        title="Import Multisig"
        visible={isModalVisible}
        closable={walletParams === undefined}
        // onCancel={handleCancel}

        destroyOnClose
        footer={[
          <Button key="back" onClick={handleCancel} disabled={walletParams !== undefined}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!address || !network || error || walletName === "" || duplicateError}
            loading={pendingImport}
            onClick={handleSubmit}
          >
            Import
          </Button>,
        ]}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder={"Multisig address"}
            value={address}
            onChange={setAddress}
          />
          <Input
            placeholder="Enter wallet name"
            value={walletName}
            onChange={onEnterWalletName}
            suffix={loadingWalletName && <Spin spinning />}
            disabled={error || duplicateError}
          />
          <Select defaultValue={targetNetwork.name} onChange={value => setNetwork(value)}>
            {networkOptions}
          </Select>
          {error && <Alert message="Unable to import: this doesn't seem like a multisig." type="error" showIcon />}
          {duplicateError && <Alert message="Wallet already present ! " type="error" showIcon />}
        </div>
      </Modal>
    </>
  );
}
