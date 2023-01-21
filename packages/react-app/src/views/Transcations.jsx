import React from "react";
import axios from "axios";
import { Card, Collapse, Button, Tabs } from "antd";

import { useStore } from "../store/useStore";
import { useEffect } from "react";
import { TranscactionPool, TranscactionHistory } from "../components";

const Transcations = () => {
  const [state, dispatch] = useStore();

  const { nonce } = state;

  return (
    <div>
      <Card
        title={"Transcactions"}
        extra={
          <div className="font-bold">
            Current Nonce <span className="text-green-400"># {nonce ? nonce.toString() : 0}</span>
          </div>
        }
      >
        <Tabs
          defaultActiveKey="1"
          size="small"
          items={[
            {
              label: "Pool",
              key: "transcactionPool",
              children: <TranscactionPool />,
            },

            {
              label: "History",
              key: "transcactionHistory",
              children: <TranscactionHistory />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Transcations;
