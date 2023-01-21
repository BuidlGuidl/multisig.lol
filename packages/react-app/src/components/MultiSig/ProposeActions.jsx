import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Typography, Card, Tooltip, Input } from "antd";
import { SendOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

import { AddressInput, EtherInput, WallectConnectInput, WalletConnectV2 } from "..";
import { useLocalStorage } from "../../hooks";
import { useStore } from "../../store/useStore";
import { TX_TYPES } from "../../constants";
import ConfirmTxModal from "./ConfirmTxModal";

const { Title } = Typography;

function ProposeActions({ type }) {
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
  } = state;
  //   const [to, setTo] = useLocalStorage("to", undefined);
  const [toAddress, setToAddress] = useState(undefined);
  const [amount, setAmount] = useState(0);
  const [customCallData, setCustomCallData] = useState("");
  const [confirmPropose, setConfirmPropose] = useState(false);

  const onPropose = async () => {
    setConfirmPropose(true);

    // try {
    //   let callData = type === TX_TYPES.SEND_ETH ? "0x" : customCallData;
    //   let executeToAddress = toAddress;
    //   const nonce = await readContracts[walletContractName].nonce();
    //   const newHash = await readContracts[walletContractName].getTransactionHash(
    //     nonce,
    //     executeToAddress,
    //     ethers.utils.parseEther("" + parseFloat(amount).toFixed(12)),
    //     callData,
    //   );
    //   const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
    //   const recover = await readContracts[walletContractName].recover(newHash, signature);
    //   const isOwner = await readContracts[walletContractName].isOwner(recover);
    //   console.log(`n-🔴 => onPropose => isOwner`, isOwner);
    //   if (isOwner) {
    //     const res = await axios.post(`${BACKEND_URL}/addPoolTx`, {
    //       txId: Date.now(),
    //       chainId: targetNetwork.chainId,
    //       walletAddress: readContracts[walletContractName]?.address,
    //       nonce: nonce?.toString(),
    //       to: executeToAddress,
    //       amount,
    //       data: callData,
    //       hash: newHash,
    //       signatures: [signature],
    //       signers: [recover],
    //       type,
    //       status: "inQueue",
    //       createdAt: moment().format("YYYY-MM-DD HH:mm"),
    //       // executedAt: "10-10-2023 10:10",
    //       createdBy: address,
    //       // executedBy: "0x0fAb64624733a7020D332203568754EB1a37DB89",
    //     });
    //     console.log(`n-🔴 => onPropose => res`, res.data);
    //     setAmount(0);
    //     setToAddress("");
    //   }
    // } catch (error) {
    //   console.log("n-Error: ", error);
    // }
  };

  const SendEth = (
    <>
      <div className="p-2">
        <AddressInput
          autoFocus
          ensProvider={mainnetProvider}
          placeholder={"Recepient address"}
          value={toAddress}
          onChange={setToAddress}
        />
      </div>
      <div className="p-2">
        <EtherInput price={price} mode="USD" value={amount} onChange={setAmount} provider={localProvider} />
      </div>

      <div className="p-2">
        <Tooltip title="Send eth">
          <Button
            type="primary"
            onClick={onPropose}
            disabled={Boolean(toAddress) === false || Boolean(amount) === false}
          >
            Propose
          </Button>
        </Tooltip>
      </div>
    </>
  );

  const CustomCall = (
    <>
      <div className="p-2">
        <AddressInput
          autoFocus
          ensProvider={mainnetProvider}
          placeholder={"Recepient address"}
          value={toAddress}
          onChange={setToAddress}
        />

        <div className="mt-2">
          <Input
            placeholder="Custom call data"
            value={customCallData}
            onChange={e => {
              setCustomCallData(e.target.value);
            }}
          />
        </div>

        <div className="mt-2">
          <EtherInput price={price} mode="USD" value={amount} onChange={setAmount} provider={localProvider} />
        </div>
      </div>

      <div className="p-2">
        <Tooltip title="Send eth">
          <Button
            type="primary"
            onClick={onPropose}
            disabled={Boolean(toAddress) === false || Boolean(customCallData) === false}
          >
            Propose
          </Button>
        </Tooltip>
      </div>
    </>
  );
  return (
    <div className="flex flex-col items-center">
      {type === TX_TYPES.SEND_ETH && SendEth}
      {type === TX_TYPES.CUSTOM_CALL && CustomCall}
      {confirmPropose && (
        <ConfirmTxModal
          isOpen={confirmPropose}
          onClose={setConfirmPropose}
          type={type}
          from={selectedWalletAddress}
          to={toAddress}
          amount={amount}
          callData={type === TX_TYPES.SEND_ETH ? "0x" : customCallData}
        />
      )}
    </div>
  );
}

export default ProposeActions;
