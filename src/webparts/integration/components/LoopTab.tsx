import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchLoopItems } from "../store/loopSlice";
import GenericTab from "./GenericTab";
import { LOOP_TAB_CONFIG } from "../utils/dynamicConfig";
import { useBacklogHandler } from "./useBacklogHandler";

export default function LoopTab() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.loop);

  const { handleSubmit, Toast } = useBacklogHandler();

  React.useEffect(() => {
    dispatch(fetchLoopItems() as any);
  }, [dispatch]);

  return (
    <>
      <GenericTab
        rows={items}
        loading={loading}
        error={error}
        config={LOOP_TAB_CONFIG}
        onAddToBacklog={handleSubmit}
      />

      {/* Toast Snackbar */}
      <Toast />
    </>
  );
}
