import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchSpItems } from "../store/spSlice";
import GenericTab from "./GenericTab";
import { SP_TAB_CONFIG } from "../utils/dynamicConfig";
import { useBacklogHandler } from "./useBacklogHandler";
import { ADO_CONFIG } from "../utils/config";

export default function SpListTab() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.sp);

  React.useEffect(() => {
    dispatch(fetchSpItems() as any);
  }, [dispatch]);
  const { handleSubmit, Toast } = useBacklogHandler();
  console.log(items);
  return (
    <>
      <GenericTab
        rows={items}
        loading={loading}
        error={error}
        config={SP_TAB_CONFIG}
        onAddToBacklog={handleSubmit}
        azureConfig={{
          org: ADO_CONFIG.org,
          token: ADO_CONFIG.pat,
        }}
      />

      <Toast />
    </>
  );
}
