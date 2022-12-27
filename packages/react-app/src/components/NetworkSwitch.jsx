import React from "react";
import { Dropdown, Menu, Button } from "antd";
import { NETWORKS } from "../constants";

function NetworkSwitch({ selectedNetwork, onChangeNetwork }) {
  const menu = (
    <Menu>
      {Object.keys(NETWORKS).map(name => (
        <Menu.Item key={name}>
          <Button type="text" onClick={() => onChangeNetwork(name)}>
            <span style={{ textTransform: "capitalize" }}>{name}</span>
          </Button>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div>
      <Dropdown.Button overlay={menu} placement="bottomRight" trigger={["click"]}>
        <span style={{ textTransform: "capitalize", color: NETWORKS[selectedNetwork]?.color }}>{selectedNetwork}</span>
      </Dropdown.Button>
    </div>
  );
}

export default NetworkSwitch;
