import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchSpItems } from "../store/spSlice";
import GenericTab from "./GenericTab";
import { SP_TAB_CONFIG } from "../utils/dynamicConfig";
import { useBacklogHandler } from "./useBacklogHandler";

export default function SpListTab() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.sp);

  React.useEffect(() => {
    dispatch(fetchSpItems() as any);
  }, [dispatch]);

  const { handleSubmit, Toast } = useBacklogHandler();
  return (
    <>
      <GenericTab
        rows={items}
        loading={loading}
        error={error}
        config={SP_TAB_CONFIG}
        onAddToBacklog={handleSubmit}
      />

      <Toast />
    </>
  );
}
