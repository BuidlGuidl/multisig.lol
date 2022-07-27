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
  multiSigs,
  setMultiSigs,
  setCurrentMultiSigAddress,
  multiSigWalletABI,
  localProvider,
  poolServerUrl,
  getUserWallets,
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

  const handleSubmit = async () => {
    try {
      setPendingImport(true);

      const contract = new ethers.Contract(address, multiSigWalletABI, localProvider);

      let signaturesRequired = await contract.signaturesRequired();
      signaturesRequired = signaturesRequired.toString();
      // let owners = await contract.owners();
      let owners = [];
      let walletName = await contract.name();
      let walletAddress = contract.address;

      let ownnersCount = await contract.numberOfOwners();
      ownnersCount = ownnersCount.toString();
      for (let index = 0; index < +ownnersCount; index++) {
        let owner = await contract.owners(index);
        owners.push(owner);
      }

      console.log("owners: ", owners);
      // {
      //     "walletName": "test",
      //     "walletAddress": "0x92973c0DFb0676713A161471841e475b3c6ad087",
      //     "chainIds": [
      //         31337
      //     ],
      //     "signaturesRequired": 1,
      //     "owners": [
      //         "0x813f45BD0B48a334A3cc06bCEf1c44AAd907b8c1"
      //     ]
      // }

      // old code wallet with address
      // let newImportedMultiSigs = importedMultiSigs || {};
      // (newImportedMultiSigs[network] = newImportedMultiSigs[network] || []).push(address);
      // newImportedMultiSigs[network] = [...new Set(newImportedMultiSigs[network])];
      // setImportedMultiSigs(newImportedMultiSigs);

      let importWalletData = {
        walletName,
        walletAddress,
        chainIds: [targetNetwork.chainId],
        signaturesRequired: +signaturesRequired,
        owners,
      };

      console.log("n-importWalletData: ", importWalletData);

      let newImportedMultiSigs = importedMultiSigs || {};
      (newImportedMultiSigs[network] = newImportedMultiSigs[network] || []).push(importWalletData);
      newImportedMultiSigs[network] = [newImportedMultiSigs[network]];
      console.log("n-newImportedMultiSigs[network]: ", newImportedMultiSigs[network]);
      setImportedMultiSigs(newImportedMultiSigs);

      await getUserWallets(true);

      // if (network === targetNetwork.name) {
      //   setMultiSigs([...new Set([...newImportedMultiSigs[network], ...multiSigs])]);
      //   setCurrentMultiSigAddress(address);

      //   let reqData = {
      //     owners,
      //     signaturesRequired,
      //   };
      //   const res = await axios.post(
      //     poolServerUrl + `createWallet/${address}/${walletName}/${walletAddress}/${targetNetwork.chainId}`,
      //     reqData,
      //   );
      //   let data = res.data;
      //   console.log("import wallet res data: ", data);
      // }

      resetState();
      setIsModalVisible(false);
      window.location.reload();
    } catch (e) {
      console.log("Import error:", e);
      setError(true);
      setPendingImport(false);
    }
  };

  return (
    <>
      <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
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
