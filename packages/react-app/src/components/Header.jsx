import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

// displays a page header

export default function Header(props) {
  return (
    <div className="flex justify-between items-center p-2  shadow-sm ">
      <div className=" flex flex-1 items-center">
        <Title level={4} style={{ margin: "0 0.5rem 0 0" }}>
          👛 multisig.lol
        </Title>
        <a href="https://github.com/austintgriffith/maas" target="_blank">
          warning: prototype for testnet use (view code)
        </a>
      </div>
      {props.children}
    </div>
  );
}
