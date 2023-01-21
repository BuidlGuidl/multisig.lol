import React from "react";
import { message, Dropdown, Button } from "antd";
import { Link } from "react-router-dom";
import { useEventListener } from "eth-hooks/events";
import { ethers } from "ethers";

import { Address } from "../";
import { useStore } from "../../store/useStore";
import { useEffect } from "react";
import useEvent from "../../hooks/useEvent";
import { useState } from "react";

const WALLET_CONTRACT_ADDRESS = "0x924E029aa245AbADC5Ebd379457eAa48Cf0E4422";

export default function WalletList() {
  const [store, dispatch] = useStore();
  const [currentWalletName, setCurrentWalletName] = useState();
  const [ownedWallets, setOwnedWallets] = useState([]);
  // console.log(`n-🔴 => ownedWallets`, ownedWallets);
  const {
    address,
    readContracts,
    localProvider,
    factoryContractName,
    // walletContractName,
    selectedWalletAddress,
    onChangeWallet,
    refreshToggle,
    // setRefreshToggle,
    walletData,
    // setWalletData,
    targetNetwork,
    // multiSigWalletABI,
    importedWalletList,
    // userWallets,
    setUserWallets,
    hiddenWalletList,
    // setHiddenWalletList,
  } = store;

  // const wallets = useEventListener(
  //   factoryContractName in readContracts && readContracts,
  //   factoryContractName,
  //   "Create2Event",
  //   localProvider,
  //   0,
  // );

  const owners = useEvent(
    factoryContractName in readContracts && readContracts,
    factoryContractName,
    "Owners",
    refreshToggle,
  );
  // console.log(`n-🔴 => WalletList => owners`, owners);

  const wallets = useEvent(
    factoryContractName in readContracts && readContracts,
    factoryContractName,
    "Create2Event",
    refreshToggle,
  );
  // console.log(`n-🔴 => WalletList => wallets`, wallets);

  const handleButtonClick = e => {
    message.info("Click on left button.");
  };

  const handleWalletChange = ({ key }) => {
    let selectedWallet = wallets.find(data => data.args.contractAddress === key);
    onChangeWallet(key, selectedWallet.args.name);
    setCurrentWalletName(selectedWallet.args.name);
  };

  const filterWallets = () => {
    if (wallets.length === 0) {
      return [];
    }
    return wallets
      .filter(
        data =>
          ownedWallets.includes(data.args.contractAddress) &&
          hiddenWalletList.includes(data.args.contractAddress) === false,
      )
      .map(data => {
        let wallet = data.args;
        return {
          label: wallet.name,
          key: wallet.contractAddress,
        };
      });
  };

  const walletList = [...filterWallets()];

  const menuProps = {
    items: walletList,
    onClick: handleWalletChange,
  };
  const getOwnedWallets = async (wallets, owners) => {
    let fromWallets = [];
    for (const { args } of wallets) {
      const { owners } = args;
      const isOwner = await owners.includes(address);
      if (isOwner) {
        fromWallets.push(args.contractAddress);
      }
    }

    let fromOwners = [];
    for (const { args } of owners) {
      // const wallet = new ethers.Contract(args.contractAddress, multiSigWalletABI, localProvider);
      const { owners } = args;
      const isOwner = await owners.includes(address);
      if (isOwner) {
        fromOwners.push(args.contractAddress);
      }
    }

    const ownedWallets = [...new Set([...fromWallets, ...fromOwners])];

    return ownedWallets;
  };

  const loadWallets = async () => {
    // loding from frontend event , listten costly on performance
    let userWallets = await getOwnedWallets(wallets, owners);
    // console.log(`n-🔴 => loadWallets => userWallets`, userWallets);

    // loading from contract filter
    // let ownedWallets = await readContracts[factoryContractName].getWallets(address);

    // add imported wallets in owned wallets
    userWallets = [...userWallets, ...importedWalletList];
    // remove hidden wallets
    // userWallets = userWallets.filter(contractAddress => hiddenWalletList.includes(contractAddress) === false);

    // console.log(`n-🔴 => loadWallets => userWallets`, userWallets);

    setOwnedWallets([...userWallets]);

    let filteredWallets = wallets.filter(data => {
      return userWallets.includes(data.args.contractAddress);
    });
    // console.log(`n-🔴 => filteredWallets => filteredWallets`, filteredWallets);

    setUserWallets(filteredWallets);

    if (wallets && wallets.length > 0 && filteredWallets.length > 0 && address) {
      let lastWallet = filteredWallets[filteredWallets.length - 1].args;

      if (walletData && walletData[targetNetwork?.chainId]?.selectedWalletAddress === undefined) {
        onChangeWallet(lastWallet.contractAddress, lastWallet.name);
        setCurrentWalletName(lastWallet.name);
        return;
      }

      if (walletData && walletData[targetNetwork?.chainId]?.selectedWalletAddress !== undefined) {
        onChangeWallet(
          walletData[targetNetwork?.chainId]?.selectedWalletAddress,
          walletData[targetNetwork?.chainId]?.selectedWalletName,
        );
        setCurrentWalletName(walletData[targetNetwork?.chainId]?.selectedWalletName);
        return;
      }
    }
  };

  useEffect(() => {
    if (localProvider && wallets.length > 0 && owners.length > 0 && address) {
      void loadWallets();
    }
  }, [wallets, address, owners]);

  return (
    <div>
      <div className="logo- mt-3 p-2  rounded-md flex flex-col items-center shadow-sm">
        <Dropdown.Button size="middle" className="flex justify-center" menu={menuProps} onClick={handleButtonClick}>
          <div>
            <Address address={selectedWalletAddress} blockieSize={10} fontSize={13} />
          </div>
        </Dropdown.Button>
        <div className="text-gray-400 text-sm mt-2">{currentWalletName}</div>
        <Button type="link" shape="" size={"small"}>
          <Link to={"/createWallet"}>Create wallet</Link>
        </Button>

        {/* <Button
          shape=""
          size={"small"}
          onClick={async () => {
            let data = await readContracts[factoryContractName].getWallets(address);
            console.log(`n-🔴 => onClick={ => data`, data);
          }}
        >
          test
        </Button> */}
      </div>
    </div>
  );
}
