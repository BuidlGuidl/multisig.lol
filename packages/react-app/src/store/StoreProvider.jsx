import React, { createContext, useEffect, useReducer } from "react";

export const StoreContext = createContext();

// global reducer state that can override the properties with payload
const Reducer = (state, action) => {
  return { ...state, ...action.payload };
};

const StoreProvider = ({ children, store }) => {
  const [state, dispatch] = useReducer(Reducer, store);

  useEffect(() => {
    if (store) {
      dispatch({ payload: { ...store } });
    }
  }, [...Object.values(store)]);

  return <StoreContext.Provider value={[state, dispatch]}>{children}</StoreContext.Provider>;
};

export default StoreProvider;
