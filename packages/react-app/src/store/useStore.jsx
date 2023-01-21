import { useContext } from "react";
import { StoreContext } from "./StoreProvider";

export const useStore = () => useContext(StoreContext);
