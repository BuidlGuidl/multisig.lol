import React, { useEffect, useState } from "react";
import { Descriptions, Card, Input, InputNumber, Button, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import { AddressInput, Address } from "..";
import { useStore } from "../../store/useStore";
import ConfirmTxModal from "./ConfirmTxModal";
import { TX_TYPES } from "../../constants";

const ManageOwners = () => {
  const [state, dispatch] = useStore();

  const [signatureRequired, setSignatureRequired] = useState(1);
  const [newOwnerAddress, setNewOwnerAddres] = useState(undefined);
  const [removeOwnerAddress, setRemoveOwnerAddress] = useState(undefined);
  const [isConfirm, setIsConfirm] = useState(false);
  const [callData, setCallData] = useState(undefined);
  const [owners, setOwners] = useState([]);

  const {
    nonce,
    address,
    BACKEND_URL,
    contractAddress,
    userSigner,
    localProvider,
    mainnetProvider,
    price,
    readContracts,
    writeContracts,
    walletContractName,
    targetNetwork,
    selectedWalletAddress,
    signaturesRequired,
    tx,
  } = state;

  const onAddOwner = () => {
    let callData = readContracts[walletContractName]?.interface?.encodeFunctionData(TX_TYPES.ADD_SIGNER, [
      newOwnerAddress,
      signatureRequired,
    ]);
    console.log(`n-🔴 => onAddOwner => callData`, callData);
    setCallData(callData);
  };

  const selectRemoveOwner = address => {
    setRemoveOwnerAddress(address);
    //     let callData = readContracts[walletContractName]?.interface?.encodeFunctionData(TX_TYPES.REMOVE_SIGNER, [
    //       newOwnerAddress,
    //       signatureRequired,
    //     ]);
    //     console.log(`n-🔴 => onAddOwner => callData`, callData);
    //     setCallData(callData);
  };

  const onRemoveOwner = address => {
    let callData = readContracts[walletContractName]?.interface?.encodeFunctionData(TX_TYPES.REMOVE_SIGNER, [
      removeOwnerAddress,
      signatureRequired,
    ]);
    console.log(`n-🔴 => onAddOwner => callData`, callData);
    setCallData(callData);
  };

  const loadOwners = async () => {
    let totalOwners = await readContracts[walletContractName].numberOfOwners();
    totalOwners = Number(totalOwners?.toString());
    let owners = [];
    for (let index = 0; index < totalOwners; index++) {
      let ownerAddress = await readContracts[walletContractName].owners(index);
      owners.push(ownerAddress);
    }
    setOwners(owners);
  };

  useEffect(() => {
    if (callData !== undefined) {
      setIsConfirm(true);
    }
  }, [callData]);

  useEffect(() => {
    loadOwners();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {isConfirm && (
        <ConfirmTxModal
          from={address}
          to={selectedWalletAddress}
          callData={callData}
          isOpen={isConfirm}
          onClose={setIsConfirm}
          type={TX_TYPES.ADD_SIGNER}
        />
      )}
      <Card title="" className="w-1/2">
        <div className="flex justify-center">
          <div className="m-2">
            <AddressInput
              placeholder="Enter owner address"
              autoFocus
              ensProvider={mainnetProvider}
              onChange={setNewOwnerAddres}
            />
          </div>
          <div className="m-2 w-56">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Signature new required count"
              className="m-2"
              min={1}
              value={signatureRequired}
              onChange={value => setSignatureRequired(value)}
            />
          </div>
          <div className="m-2 ">
            <Button type="primary" onClick={onAddOwner}>
              Add
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-10 w-1/2">
        <Card title="Owners" className="w--full">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Signature requried">1</Descriptions.Item>

            <Descriptions.Item label="Owners">
              <div>
                {owners.map((owner, index) => (
                  <div className="flex justify-evenly m-2" key={index}>
                    <Address address={owner} fontSize={15} />
                    <Button
                      shape="circle"
                      disabled={owners.length === 1}
                      icon={<DeleteOutlined style={{ color: "red" }} />}
                      onClick={() => selectRemoveOwner(owner)}
                    />
                  </div>
                ))}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
      <Modal
        title="Confirm remove owner"
        open={removeOwnerAddress}
        onOk={onRemoveOwner}
        okText="Propose"
        onCancel={() => {
          setRemoveOwnerAddress(undefined);
        }}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Remove address">
            <Address address={removeOwnerAddress} fontSize={15} />
          </Descriptions.Item>

          <Descriptions.Item label="New signature required">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter"
              className="m-2"
              min={1}
              value={signatureRequired}
              onChange={value => setSignatureRequired(value)}
            />
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};
export default ManageOwners;
