import { Button } from "antd";
import React from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";

import Address from "./Address";
import Balance from "./Balance";
import Wallet from "./Wallet";

/**
  ~ What it does? ~

  Displays an Address, Balance, and Wallet as one Account component,
  also allows users to log in to existing accounts and log out

  ~ How can I use? ~

  <Account
    useBurner={boolean}
    address={address}
    localProvider={localProvider}
    userProvider={userProvider}
    mainnetProvider={mainnetProvider}
    price={price}
    web3Modal={web3Modal}
    loadWeb3Modal={loadWeb3Modal}
    logoutOfWeb3Modal={logoutOfWeb3Modal}
    blockExplorer={blockExplorer}
    isContract={boolean}
  />

  ~ Features ~

  - Provide address={address} and get balance corresponding to the given address
  - Provide localProvider={localProvider} to access balance on local network
  - Provide userProvider={userProvider} to display a wallet
  - Provide mainnetProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth")
  - Provide price={price} of ether and get your balance converted to dollars
  - Provide web3Modal={web3Modal}, loadWeb3Modal={loadWeb3Modal}, logoutOfWeb3Modal={logoutOfWeb3Modal}
              to be able to log in/log out to/from existing accounts
  - Provide blockExplorer={blockExplorer}, click on address and get the link
              (ex. by default "https://etherscan.io/" or for xdai "https://blockscout.com/poa/xdai/")
**/

export default function Account({
  useBurner,
  address,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer,
  gasPrice,
}) {
  const { currentTheme } = useThemeSwitcher();

  let accountButton;
  if (web3Modal?.cachedProvider) {
    accountButton = { name: "Logout", action: logoutOfWeb3Modal };
  } else {
    accountButton = { name: "Connect", action: loadWeb3Modal };
  }

  return (
    <div className="flex  items-center">
      <div className="border border-gray-300  flex items-center rounded-3xl ">
        <Balance address={address} provider={localProvider} price={price} size={"1.125rem"} />
        <Wallet
          address={address}
          provider={localProvider}
          signer={userSigner}
          ensProvider={mainnetProvider}
          price={price}
          color={currentTheme === "light" ? "#1890ff" : "#2caad9"}
          size={"1.4rem"}
          padding={"0px"}
          gasPrice={gasPrice}
        />
        <div
          className={`border-2  rounded-3xl  ml-2 p-2 ${
            currentTheme === "light" ? "border-gray-200 bg-gray-100" : "border-gray-500 bg-gray-800"
          }`}
        >
          {address && (
            <Address
              address={address}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              // fontSize={"1.125rem"}
              blockieSize={8}
              fontSize={16}
            />
          )}
        </div>
      </div>
      <Button className="ml-2" shape="round" size="large" onClick={accountButton.action}>
        {accountButton.name}
      </Button>
    </div>
  );
}
