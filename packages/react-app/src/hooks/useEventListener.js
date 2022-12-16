import { useState, useEffect, useCallback } from "react";
import { Sleep } from "../constants";

const useEventListener = (contract, contractName, eventName, provider) => {
  const [eventData, setEventData] = useState([]);

  const loadEvents = async () => {
    const filter = contract[contractName].filters[eventName]();
    const queryEvents = await contract[contractName].queryFilter(filter);
    setEventData(queryEvents);
  };

  // watch events and load recursively (we can use in future to update tx list)
  //   const loadEvents = () => {
  //     contract[contractName].on(eventName, function () {
  //       if (arguments.length > 0) {
  //         const event = arguments[arguments.length - 1];
  //         console.log(`n-🔴 => event`, event);
  //         setEventData(preData => [...preData, event]);
  //       }
  //     });
  //   };

  useEffect(() => {
    if (contract && contract[contractName] !== undefined) {
      loadEvents();
    }
  }, [contractName, contract, eventName]);
  return eventData;
};

export default useEventListener;
