import { Select } from "antd";
import React from "react";
import { NETWORKS } from "../constants";

function NetworkSwitch({ selectedNetwork, onChangeNetwork }) {
  const selectNetworkOptions = [];
  for (const id in NETWORKS) {
    selectNetworkOptions.push(
      <Select.Option key={id} value={NETWORKS[id].name}>
        <span style={{ color: NETWORKS[id].color, fontSize: 15 }}>{NETWORKS[id].name}</span>
      </Select.Option>,
    );
  }

  return (
    <div className="">
      <Select className="w-full text-left" value={selectedNetwork} onChange={onChangeNetwork}>
        {selectNetworkOptions}
      </Select>
    </div>
  );
}

export default NetworkSwitch;
