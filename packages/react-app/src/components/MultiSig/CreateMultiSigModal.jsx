import React, { useState, useEffect } from "react";
import { Button, Modal, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import { Input } from "antd";
import { hexZeroPad, hexlify } from "@ethersproject/bytes";
import axios from "axios";

import { AddressInput, EtherInput } from "..";
import CreateModalSentOverlay from "./CreateModalSentOverlay";

export default function CreateMultiSigModal({
  price,
  selectedChainId,
  mainnetProvider,
  address,
  tx,
  writeContracts,
  contractName,
  isCreateModalVisible,
  setIsCreateModalVisible,
  poolServerUrl,
  reDeployWallet,
  getUserWallets,
}) {
  const [pendingCreate, setPendingCreate] = useState(false);
  const [txSent, setTxSent] = useState(false);
  const [txError, setTxError] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  const [signaturesRequired, setSignaturesRequired] = useState(false);
  const [amount, setAmount] = useState("0");
  const [owners, setOwners] = useState([""]);
  const [walletName, setWalletName] = useState("");

  useEffect(() => {
    if (address) {
      setOwners([address, ""]);
    }
  }, [address]);

  const showCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleCancel = () => {
    setWalletName("");
    setIsCreateModalVisible(false);
    getUserWallets();
  };

  const addOwnerField = () => {
    const newOwners = [...owners, ""];
    setOwners(newOwners);
  };

  const removeOwnerField = index => {
    const newOwners = [...owners];
    newOwners.splice(index, 1);
    setOwners(newOwners);
  };

  const updateOwner = (value, index) => {
    // for a single addresss
    if (value.length <= 42) {
      const newOwners = [...owners];
      newOwners[index] = value;
      setOwners(newOwners);
    }

    // if value is multiple addresses with comma
    if (value.length > 42) {
      addMultipleAddress(value);
    }
  };

  const addMultipleAddress = value => {
    // add basic validation a address should contains 0x with length of 42 chars
    const validateAddress = address => address.includes("0x") && address.length === 42;

    const addresses = value.trim().split(",");
    let uniqueAddresses = [...new Set([...addresses])];

    uniqueAddresses = uniqueAddresses.filter(validateAddress);

    let finalUniqueAddresses = [...new Set([...owners.filter(validateAddress), ...uniqueAddresses])];
    setOwners(finalUniqueAddresses);
  };

  const validateFields = () => {
    let valid = true;

    if (signaturesRequired > owners.length) {
      console.log("Validation error: signaturesRequired is greather than number of owners.");
      valid = false;
    }

    owners.forEach((owner, index) => {
      let err;
      if (!owner) {
        err = "Required Input";
      } else if (owners.slice(0, index).some(o => o === owner)) {
        err = "Duplicate Owner";
      } else if (!ethers.utils.isAddress(owner)) {
        err = "Bad format";
      }

      if (err) {
        console.log("Owners field error: ", err);
        valid = false;
      }
    });

    return valid;
  };

  const resetState = () => {
    setPendingCreate(false);
    setTxSent(false);
    setTxError(false);
    setTxSuccess(false);
    setOwners([""]);
    setAmount("0");
    setSignaturesRequired(false);
  };

  const handleSubmit = () => {
    try {
      setPendingCreate(true);

      if (!validateFields()) {
        setPendingCreate(false);
        throw "Field validation failed.";
      }
      let currentWalletName = reDeployWallet === undefined ? walletName : reDeployWallet["walletName"];
      console.log("currentWalletName: ", currentWalletName);
      const id = ethers.utils.id(String(address) + currentWalletName);
      const hash = ethers.utils.keccak256(id);
      const salt = hexZeroPad(hexlify(hash), 32);

      tx(
        // old create
        // writeContracts[contractName].create(selectedChainId, owners, signaturesRequired, {
        //   value: ethers.utils.parseEther("" + parseFloat(amount).toFixed(12)),
        // }
        // create 2
        writeContracts[contractName].create(selectedChainId, owners, signaturesRequired, salt, currentWalletName, {
          value: ethers.utils.parseEther("" + parseFloat(amount).toFixed(12)),
        }),
        async update => {
          let rcpt = await update.wait();
          console.log("rcpt: ", rcpt);
          if (update && (update.error || update.reason)) {
            console.log("tx update error!");
            setPendingCreate(false);
            setTxError(true);
          }

          if (update && update.code) {
            setPendingCreate(false);
            setTxSent(false);
          }

          if (update && (update.status === "confirmed" || update.status === 1)) {
            console.log("tx update confirmed!");
            setPendingCreate(false);
            setTxSuccess(true);
            setTimeout(() => {
              setIsCreateModalVisible(false);
              resetState();
            }, 2500);
          }

          let computed_wallet_address = await writeContracts[contractName].computedAddress(salt, currentWalletName);
          console.log("computed_wallet_address: ", computed_wallet_address);

          let walletAddress = reDeployWallet === undefined ? computed_wallet_address : reDeployWallet["walletAddress"];

          if (reDeployWallet === undefined) {
            const res = await axios.get(
              poolServerUrl + `createWallet/${address}/${walletName}/${walletAddress}/${selectedChainId}`,
            );
            let data = res.data;
            console.log("create wallet res data: ", data);
          }

          if (reDeployWallet !== undefined) {
            // const res = await axios.get(poolServerUrl + `updateChainId/${address}/${walletAddress}/${selectedChainId}`);
            const res = await axios.get(poolServerUrl + `updateChainId/${address}/${walletAddress}/${selectedChainId}`);
            let data = res.data;
            console.log("update chain res data: ", data);
          }
          getUserWallets();
        },
      ).catch(err => {
        setPendingCreate(false);
        throw err;
      });

      setTxSent(true);
    } catch (e) {
      console.log("CREATE MUTLI-SIG SUBMIT FAILED: ", e);
    }
  };

  return (
    <>
      {reDeployWallet === undefined && (
        <Button type="primary" onClick={showCreateModal}>
          Create
        </Button>
      )}

      {reDeployWallet !== undefined && (
        <Button type="primary" onClick={showCreateModal} danger>
          Re-Deploy
        </Button>
      )}
      <Modal
        title="Create Multi-Sig Wallet"
        visible={isCreateModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={pendingCreate}
            onClick={handleSubmit}
            danger={reDeployWallet !== undefined}
          >
            {reDeployWallet === undefined ? "Create" : "Deploy"}
          </Button>,
        ]}
      >
        {txSent && (
          <CreateModalSentOverlay
            txError={txError}
            txSuccess={txSuccess}
            pendingText="Creating Multi-Sig"
            successText="Multi-Sig Created"
            errorText="Transaction Failed"
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            placeholder="Enter wallet name"
            onChange={event => setWalletName(event.target.value)}
            value={reDeployWallet !== undefined ? reDeployWallet["walletName"] : walletName}
            disabled={reDeployWallet !== undefined}
          />

          {owners.map((owner, index) => (
            <div key={index} style={{ display: "flex", gap: "1rem" }}>
              <div style={{ width: "90%" }}>
                <AddressInput
                  autoFocus
                  ensProvider={mainnetProvider}
                  placeholder={"Owner address"}
                  value={owner}
                  onChange={val => updateOwner(val, index)}
                />
              </div>
              {index > 0 && (
                <Button style={{ padding: "0 0.5rem" }} danger onClick={() => removeOwnerField(index)}>
                  <DeleteOutlined />
                </Button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", width: "90%" }}>
            <Button onClick={addOwnerField}>
              <PlusOutlined />
            </Button>
          </div>
          <div style={{ width: "90%" }}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Number of signatures required"
              value={signaturesRequired}
              onChange={setSignaturesRequired}
            />
          </div>
          <div style={{ width: "90%" }}>
            <EtherInput
              placeholder="Fund your multi-sig (optional)"
              price={price}
              mode="USD"
              value={amount}
              onChange={setAmount}
            />
          </div>
          {/* <Button
            type="primary"
            onClick={async () => {
              const id = ethers.utils.id(String(address) + "N");
              const hash = ethers.utils.keccak256(id);
              const salt = hexZeroPad(hexlify(hash), 32);
              let caddress = await writeContracts[contractName].computedAddress(salt, "N2");
              console.log("caddress: ", caddress);
            }}
          >
            computed address
          </Button> */}
        </div>
      </Modal>
    </>
  );
}
