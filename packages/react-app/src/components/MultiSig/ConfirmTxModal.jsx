import React, { useState } from "react";
import { Modal, Button, Descriptions, InputNumber } from "antd";
import { ethers } from "ethers";
import axios from "axios";
import moment from "moment";
import { AlertOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";

import { useStore } from "../../store/useStore";
import { TX_TYPES } from "../../constants";
import { Address, Balance } from "..";

const ConfirmTxModal = ({ isOpen, onClose, type, from, to, callData, amount, gas, url, setActiveTab }) => {
  // adjusting amount from safe app
  amount = type === TX_TYPES.SAFE_APP ? ethers.utils.formatEther(amount) : amount;

  const [state, dispatch] = useStore();
  const {
    address,
    BACKEND_URL,
    contractAddress,
    userSigner,
    localProvider,
    mainnetProvider,
    price,
    readContracts,
    walletContractName,
    targetNetwork,
    selectedWalletAddress,
    nonce,
  } = state;

  const [customNonce, setCustomNonce] = useState(null);
  console.log(`n-🔴 => ConfirmTxModal => customNonce`, customNonce);
  const history = useHistory();

  const onPropose = async () => {
    try {
      let executeToAddress = to;
      const nonce = customNonce !== null ? customNonce : await readContracts[walletContractName].nonce();
      const newHash = await readContracts[walletContractName].getTransactionHash(
        nonce,
        executeToAddress,
        ethers.utils.parseEther("" + parseFloat(amount ? amount : 0).toFixed(12)),
        callData,
      );
      const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
      const recover = await readContracts[walletContractName].recover(newHash, signature);
      const isOwner = await readContracts[walletContractName].isOwner(recover);
      console.log(`n-🔴 => onPropose => isOwner`, isOwner);
      if (isOwner) {
        const res = await axios.post(`${BACKEND_URL}/addPoolTx`, {
          txId: Date.now(),
          chainId: targetNetwork.chainId,
          walletAddress: readContracts[walletContractName]?.address,
          nonce: nonce?.toString(),
          to: executeToAddress,
          amount: amount ? amount : 0,
          data: callData,
          hash: newHash,
          signatures: [signature],
          signers: [recover],
          type,
          url,
          status: "inQueue",
          createdAt: moment().format("YYYY-MM-DD HH:mm"),
          // executedAt: "10-10-2023 10:10",
          createdBy: address,
          // executedBy: "0x0fAb64624733a7020D332203568754EB1a37DB89",
        });
        console.log(`n-🔴 => onPropose => res`, res.data);

        if (type !== TX_TYPES.SAFE_APP) {
          history.push("/transcactions");
          return;
        }

        if (type === TX_TYPES.SAFE_APP) {
          setActiveTab("transcactionPool");
          onClose(false);
        }
      }
    } catch (error) {
      console.log("n-Error: ", error);
    }
  };

  return (
    <>
      <Modal
        title={
          <div className="flex justify-start items-center">
            <div className="mr-2">
              <AlertOutlined style={{ color: "orange", fontSize: 25 }} />
            </div>
            <div className="mt-2">Confirm transcaction details</div>
          </div>
        }
        open={isOpen}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              onClose(false);
            }}
          >
            Cancel
          </Button>,
          <Button key="ok" type="primary" onClick={onPropose}>
            Confirm
          </Button>,
        ]}
      >
        <Descriptions title="" column={1} bordered>
          {type === TX_TYPES.SAFE_APP && <Descriptions.Item label="App URL">{url}</Descriptions.Item>}

          <Descriptions.Item label="From">
            <Address address={from} fontSize={15} />
          </Descriptions.Item>

          <Descriptions.Item label="To">
            <Address address={to} fontSize={15} />
          </Descriptions.Item>

          <Descriptions.Item label="Amount">
            <Balance
              balance={
                amount
                  ? type === TX_TYPES.SAFE_APP
                    ? ethers.utils.parseEther(String(amount))
                    : ethers.utils.parseEther(String(amount))
                  : 0
              }
              dollarMultiplier={price}
              size={15}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Data">
            <Address address={callData} fontSize={15} />
          </Descriptions.Item>
          <Descriptions.Item label="Type">{type}</Descriptions.Item>
          {gas && <Descriptions.Item label="Gas">{gas}</Descriptions.Item>}
          <Descriptions.Item label="Nonce">{nonce?.toString()}</Descriptions.Item>
          <Descriptions.Item label="Custom nonce">
            <InputNumber
              placeholder="Enter custom nonce"
              min={nonce.toString()}
              onChange={value => setCustomNonce(value)}
            />
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};

export default ConfirmTxModal;
