export const getSDKVersion = () => {
  return "7.6.0"; // IMPORTANT: needs to be >= 1.0.0
};

// i.e. 0-255 -> '00'-'ff'
const dec2hex = dec => dec.toString(16).padStart(2, "0");

const generateId = len => {
  const arr = new Uint8Array((len || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
};

export const generateRequestId = () => {
  if (typeof window !== "undefined") {
    return generateId(10);
  }

  return new Date().getTime().toString(36);
};
