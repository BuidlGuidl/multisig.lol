import { useState, useEffect } from "react";
import { Input, Button, Spin } from "antd";
import { NETWORKS } from "../constants";
import {} from ".";
import { useSafeInject } from "../contexts/SafeInjectContext";

export default function IFrame({ contractAddress }) {
  const cachedNetwork = window.localStorage.getItem("network");
  let targetNetwork = NETWORKS[cachedNetwork || "mainnet"];

  const { setAddress, appUrl, setAppUrl, setRpcUrl, iframeRef, transactions } = useSafeInject();

  const [isIFrameLoading, setIsIFrameLoading] = useState(false);
  const [inputAppUrl, setInputAppUrl] = useState();

  useEffect(() => {
    setAddress(contractAddress);
    setRpcUrl(targetNetwork.rpcUrl);

    console.log(contractAddress, targetNetwork.rpcUrl);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <Input
        placeholder="dapp URL"
        style={{
          minWidth: "18rem",
          maxWidth: "20rem",
        }}
        autoFocus={true}
        value={inputAppUrl}
        onChange={e => setInputAppUrl(e.target.value)}
      />
      <Button
        type={"primary"}
        style={{
          marginTop: "1rem",
          maxWidth: "8rem",
        }}
        onClick={() => {
          setAppUrl(inputAppUrl);
          setIsIFrameLoading(true);
        }}
      >
        {isIFrameLoading ? <Spin /> : "Load"}
      </Button>
      {appUrl && (
        <iframe
          title="app"
          src={appUrl}
          width="1000rem"
          height="500rem"
          style={{
            marginTop: "1rem",
          }}
          ref={iframeRef}
          onLoad={() => setIsIFrameLoading(false)}
        />
      )}
      <pre>{JSON.stringify(transactions, null, 2)}</pre>
    </div>
  );
}
