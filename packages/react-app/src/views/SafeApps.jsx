import React from "react";
import axios from "axios";
import { Card, Collapse, Button, Tabs, Input, Avatar, Divider } from "antd";
import { Link, useHistory } from "react-router-dom";

import { useStore } from "../store/useStore";
import { useEffect } from "react";
import { TranscactionPool, TranscactionHistory } from "../components";
import { useState } from "react";

const SafeApps = () => {
  const history = useHistory();
  const [state, dispatch] = useStore();

  const { selectedWalletAddress, targetNetwork } = state;

  const [safeApps, setSafeApps] = useState([]);

  const fetchSafeDapps = async chainId => {
    const response = await axios.get(`https://safe-client.gnosis.io/v1/chains/${chainId}/safe-apps`);
    setSafeApps(response.data);
  };

  useEffect(() => {
    fetchSafeDapps(targetNetwork.chainId);
    //     fetchSafeDapps(1);
  }, [targetNetwork]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-1/2">
        <Card>
          {/* <Input placeholder="Enter safe app address" /> */}
          <Input.Search
            placeholder="Enter safe app address"
            onSearch={value => {
              console.log(`n-🔴 => SafeApps => value`, value);
              history.push({
                pathname: "/safeApp",
                state: { url: value },
              });
            }}
            enterButton="launch"
            size="large"
          />
        </Card>
      </div>
      <div className="w-full m-2 flex justify-center flex-wrap">
        {safeApps.length > 0 &&
          safeApps.map((item, index) => (
            <div key={index} className="m-2 w-1/4">
              <Card
                className="h--44"
                actions={[
                  <div></div>,
                  <div></div>,
                  <Link to={{ pathname: "/safeApp", state: { url: item.url } }}>
                    <Button type="primary">Launch</Button>
                  </Link>,
                ]}
              >
                <Card.Meta
                  className="flex justify-center  items-center"
                  avatar={<Avatar src={item.iconUrl} alt={item.name} size={"large"} />}
                  title={item.name}
                  description={item.description}
                />
              </Card>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SafeApps;
