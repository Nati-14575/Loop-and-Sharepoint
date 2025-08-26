import { useContext } from "react";
import { SpfxContext } from "./SpfxContext";
import { store } from "../store/store";
import { fetchSpItems } from "../store/spSlice";
import { UserListConfig } from "../utils/dynamicConfig";

export function useSpfxExtra(config?: UserListConfig) {
  const ctx = useContext(SpfxContext);

  return {
    ctx,
    refresh: () => {
      if (config) {
        store.dispatch(fetchSpItems(config) as any);
      } else {
        console.warn("No config passed to refresh");
      }
    },
  };
}
