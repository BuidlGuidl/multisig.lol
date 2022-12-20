import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Typography, Card, Tooltip } from "antd";
import { SendOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";

import { AddressInput, EtherInput } from "..";
import { useLocalStorage } from "../../hooks";

const { Title } = Typography;

function SendEth({
  BACKEND_URL,
  contractAddress,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  readContracts,
  contractName,
}) {
  //   const [to, setTo] = useLocalStorage("to", undefined);
  const [toAddress, setToAddress] = useState(undefined);
  const [amount, setAmount] = useState(0);

  const onSendEth = async () => {
    try {
      let callData = "0x";
      let executeToAddress = toAddress;
      const nonce = await readContracts.MultiSigWallet.nonce();

      const newHash = await readContracts[contractName].getTransactionHash(
        nonce,
        executeToAddress,
        ethers.utils.parseEther("" + parseFloat(amount).toFixed(12)),
        callData,
      );

      const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));

      const recover = await readContracts[contractName].recover(newHash, signature);

      const isOwner = await readContracts[contractName].isOwner(recover);

      if (isOwner) {
        const res = await axios.post(BACKEND_URL, {
          chainId: localProvider._network.chainId,
          address: readContracts[contractName]?.address,
          nonce: nonce,
          to: executeToAddress,
          amount,
          data: callData,
          hash: newHash,
          signatures: [signature],
          signers: [recover],
        });
        setAmount(0);
        setToAddress("");
      }
    } catch (error) {
      console.log("n-Error: ", error);
    }
  };

  return (
    <div>
      <div className="m-2 p-1 flex justify-center items-center border-2 rounded-lg">
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

        <Tooltip title="Send eth">
          <Button
            type="primary"
            shape="circle"
            icon={
              <dev className="flex items-center justify-center">
                <SendOutlined />
              </dev>
            }
            onClick={onSendEth}
            disabled={Boolean(toAddress) === false || Boolean(amount) === false}
          />
        </Tooltip>
      </div>
    </div>
  );
}

export default SendEth;
