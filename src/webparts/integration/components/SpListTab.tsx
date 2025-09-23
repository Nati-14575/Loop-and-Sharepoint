import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchSpItems } from "../store/spSlice";
import GenericTab from "./GenericTab";
import { useBacklogHandler } from "./useBacklogHandler";
import { ADO_CONFIG } from "../utils/config";
import { UserListConfig } from "../utils/dynamicConfig";
import { ToastContainer } from "react-toastify";
type Props = {
  config: UserListConfig;
  tab: number;
};

export default function SpListTab({ config, tab }: Props) {
  const { siteUrl, listTitle, expand, selectExtra } = config;
  const dispatch = useAppDispatch();
  // fetch SharePoint items with expand/select
  React.useEffect(() => {
    dispatch(fetchSpItems(config));
  }, [dispatch, siteUrl, listTitle, expand, selectExtra]);
  const { items, loading, error } = useAppSelector((s) => s.sp);
  const { handleSubmit } = useBacklogHandler();
  return (
    <>
      <GenericTab
        rows={items}
        loading={loading}
        error={error}
        config={config}
        onAddToBacklog={handleSubmit}
        azureConfig={{
          org: ADO_CONFIG.org,
          token: ADO_CONFIG.pat,
        }}
        handleRefresh={() => {
          dispatch(fetchSpItems(config));
        }}
      />
      <ToastContainer />
    </>
  );
}
