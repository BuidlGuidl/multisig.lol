import { Layout, Typography } from "antd";
import React from "react";

const { Header } = Layout;

const { Title } = Typography;

// displays a page header

export default function MainHeader(props) {
  return (
    <Header
      className="site-layout-background flex justify-between items-center"
      style={{
        padding: 0,
        lineHeight: 2,
      }}
    >
      <div className="flex flex-1 items-center">
        <Title level={4} style={{ margin: "0 0.5rem 0 0" }}>
          👛 Multisig
        </Title>
        {/* <a href="https://github.com/buidlguidl/multisig.lol" target="_blank" rel="noreferrer">
          warning: prototype for testnet use (plz fork)
        </a> */}
      </div>
      <div className="">{props.children}</div>
    </Header>
  );
}
