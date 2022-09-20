import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { providers, utils } from "ethers";
import { useAppCommunicator, Methods } from "../helpers/communicator";

export const SafeInjectContext = createContext({
  address: undefined,
  appUrl: undefined,
  rpcUrl: undefined,
  iframeRef: null,
  transactions: undefined,
  setAddress: () => {},
  setAppUrl: () => {},
  setRpcUrl: () => {},
});

export const SafeInjectProvider = ({ children }) => {
  const [address, setAddress] = useState();
  const [appUrl, setAppUrl] = useState();
  const [rpcUrl, setRpcUrl] = useState();
  const [provider, setProvider] = useState();
  const [transactions, setTransactions] = useState();

  const iframeRef = useRef(null);
  const communicator = useAppCommunicator(iframeRef);

  const sendMessageToIframe = useCallback(
    function (message, requestId) {
      const requestWithMessage = {
        ...message,
        requestId: requestId || Math.trunc(window.performance.now()),
        version: "0.4.2",
      };

      if (iframeRef) {
        iframeRef.current?.contentWindow?.postMessage(requestWithMessage, appUrl);
      }
    },
    [iframeRef, appUrl],
  );

  useEffect(() => {
    if (!rpcUrl) return;

    setProvider(new providers.StaticJsonRpcProvider(rpcUrl));
  }, [rpcUrl]);

  useEffect(() => {
    if (!provider) return;

    communicator?.on(Methods.getSafeInfo, async () => {
      return {
        safeAddress: address,
        chainId: (await provider.getNetwork()).chainId,
        owners: [],
        threshold: 1,
        isReadOnly: false,
      };
    });

    communicator?.on(Methods.getEnvironmentInfo, async () => ({
      origin: document.location.origin,
    }));

    communicator?.on(Methods.rpcCall, async msg => {
      const params = msg.data.params;

      try {
        const response = await provider.send(params.call, params.params);
        return response;
      } catch (err) {
        return err;
      }
    });

    communicator?.on(Methods.sendTransactions, msg => {
      // @ts-expect-error explore ways to fix this
      const transactions = msg.data.params.txs.map(({ to, ...rest }) => ({
        to: utils.getAddress(to), // checksummed
        ...rest,
      }));
      setTransactions(transactions);
      // openConfirmationModal(transactions, msg.data.params.params, msg.data.id)
    });

    communicator?.on(Methods.signMessage, async msg => {
      const { message } = msg.data.params;

      // openSignMessageModal(message, msg.data.id, Methods.signMessage)
    });

    communicator?.on(Methods.signTypedMessage, async msg => {
      const { typedData } = msg.data.params;

      // openSignMessageModal(typedData, msg.data.id, Methods.signTypedMessage)
    });
  }, [communicator, address, provider]);

  return (
    <SafeInjectContext.Provider
      value={{
        address,
        appUrl,
        rpcUrl,
        iframeRef,
        transactions,
        setAddress,
        setAppUrl,
        setRpcUrl,
      }}
    >
      {children}
    </SafeInjectContext.Provider>
  );
};

export const useSafeInject = () => useContext(SafeInjectContext);
