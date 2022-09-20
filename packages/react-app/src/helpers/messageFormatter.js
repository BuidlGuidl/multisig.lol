import { getSDKVersion, generateRequestId } from "./utils";

class MessageFormatter {
  static makeRequest = (method, params) => {
    const id = generateRequestId();

    return {
      id,
      method,
      params,
      env: {
        sdkVersion: getSDKVersion(),
      },
    };
  };

  static makeResponse = (id, data, version) => ({
    id,
    success: true,
    version,
    data,
  });

  static makeErrorResponse = (id, error, version) => ({
    id,
    success: false,
    error,
    version,
  });
}

export { MessageFormatter };
