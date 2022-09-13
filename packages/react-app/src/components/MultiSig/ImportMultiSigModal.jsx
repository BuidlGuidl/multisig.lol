import React, { useState } from "react";
import { Button, Modal, Select, Alert } from "antd";
import { ethers } from "ethers";
import axios from "axios";

import { useLocalStorage } from "../../hooks";

import { AddressInput } from "..";

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
  getUserWallets,
  isFactoryDeployed,
  setSelectedWalletAddress,
}) {
  const [importedMultiSigs, setImportedMultiSigs] = useLocalStorage("importedMultiSigs");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [error, setError] = useState(false);
  const [address, setAddress] = useState();
  const [network, setNetwork] = useState(targetNetwork.name);

  const resetState = () => {
    setError(false);
    setAddress("");
    setNetwork(targetNetwork.name);
    setPendingImport(false);
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
      console.log("address: ", address);

      const contract = new ethers.Contract(address, multiSigWalletABI, localProvider);

      let signaturesRequired = await contract.signaturesRequired();
      signaturesRequired = signaturesRequired.toString();

      let factoryVersion = await getFactoryVersion(contract);
      console.log("n-factoryVersion: ", factoryVersion);

      // let signaturesRequired;
      let owners = [];
      let walletName;

      if (factoryVersion === 1) {
        walletName = await contract.name();

        let ownnersCount = await contract.numberOfOwners();
        ownnersCount = ownnersCount.toString();
        for (let index = 0; index < +ownnersCount; index++) {
          let owner = await contract.owners(index);
          owners.push(owner);
        }
      }

      let walletAddress = contract.address;

      // FOR OLDER FACTORY BEFORE CREATE2 ADJUSTMENT (THERE IS NO WALLET NAME)
      if (factoryVersion === 0) {
        walletName = contract.address;
      }

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

  return (
    <>
      <Button type="primary" ghost onClick={() => setIsModalVisible(true)} disabled={isFactoryDeployed === undefined}>
        Import
      </Button>
      <Modal
        title="Import Multisig"
        visible={isModalVisible}
        onCancel={handleCancel}
        destroyOnClose
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!address || !network}
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
          <Select defaultValue={targetNetwork.name} onChange={value => setNetwork(value)}>
            {networkOptions}
          </Select>
          {error && <Alert message="Unable to import: this doesn't seem like a multisig." type="error" showIcon />}
        </div>
      </Modal>
    </>
  );
}
