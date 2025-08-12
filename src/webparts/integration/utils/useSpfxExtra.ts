import { useContext } from "react";
import { SpfxContext } from "./SpfxContext";
import { store } from "../store/store";
import { fetchLoopItems } from "../store/loopSlice";
import { fetchSpItems } from "../store/spSlice";

// Optional helper to prefetch again if needed
export function useSpfxExtra() {
  const ctx = useContext(SpfxContext);
  return {
    ctx,
    refresh: () => {
      store.dispatch(fetchLoopItems() as any);
      store.dispatch(fetchSpItems() as any);
    },
  };
}
