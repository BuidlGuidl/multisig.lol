import { useEffect, useState } from "react";
import { MessageFormatter } from "./messageFormatter";
import { getSDKVersion } from "./utils";

const Methods = {
  sendTransaction: "sendTransactions",
  rpcCal: "rpcCall",
  getChainInf: "getChainInfo",
  getSafeInf: "getSafeInfo",
  getTxBySafeTxHas: "getTxBySafeTxHash",
  getSafeBalance: "getSafeBalances",
  signMessag: "signMessage",
  signTypedMessag: "signTypedMessage",
  getEnvironmentInf: "getEnvironmentInfo",
  requestAddressBoo: "requestAddressBook",
  wallet_getPermission: "wallet_getPermissions",
  wallet_requestPermission: "wallet_requestPermissions",
};

class AppCommunicator {
  iframeRef;
  handlers = new Map();

  constructor(iframeRef) {
    this.iframeRef = iframeRef;

    window.addEventListener("message", this.handleIncomingMessage);
  }

  on = (method, handler) => {
    this.handlers.set(method, handler);
  };

  isValidMessage = msg => {
    if (msg.data.hasOwnProperty("isCookieEnabled")) {
      return true;
    }

    const sentFromIframe = this.iframeRef.current?.contentWindow === msg.source;
    const knownMethod = Object.values(Methods).includes(msg.data.method);

    return sentFromIframe && knownMethod;
  };

  canHandleMessage = msg => {
    return Boolean(this.handlers.get(msg.data.method));
  };

  send = (data, requestId, error = false) => {
    const sdkVersion = getSDKVersion();
    const msg = error
      ? MessageFormatter.makeErrorResponse(requestId, data, sdkVersion)
      : MessageFormatter.makeResponse(requestId, data, sdkVersion);
    // console.log("send", { msg });
    this.iframeRef.current?.contentWindow?.postMessage(msg, "*");
  };

  handleIncomingMessage = async msg => {
    const validMessage = this.isValidMessage(msg);
    const hasHandler = this.canHandleMessage(msg);

    if (validMessage && hasHandler) {
      // console.log("incoming", { msg: msg.data });

      const handler = this.handlers.get(msg.data.method);
      try {
        // @ts-expect-error Handler existence is checked in this.canHandleMessage
        const response = await handler(msg);

        // If response is not returned, it means the response will be send somewhere else
        if (typeof response !== "undefined") {
          this.send(response, msg.data.id);
        }
      } catch (err) {
        this.send(err.message, msg.data.id, true);
      }
    }
  };

  clear = () => {
    window.removeEventListener("message", this.handleIncomingMessage);
  };
}

const useAppCommunicator = iframeRef => {
  const [communicator, setCommunicator] = useState(undefined);
  useEffect(() => {
    let communicatorInstance;
    const initCommunicator = iframeRef => {
      communicatorInstance = new AppCommunicator(iframeRef);
      setCommunicator(communicatorInstance);
    };

    initCommunicator(iframeRef);

    return () => {
      communicatorInstance?.clear();
    };
  }, [iframeRef]);

  return communicator;
};

export { useAppCommunicator, Methods };
