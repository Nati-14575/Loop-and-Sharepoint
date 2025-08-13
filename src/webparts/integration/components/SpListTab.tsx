import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchSpItems } from "../store/spSlice";
import GenericTab from "./GenericTab";
import { SP_TAB_CONFIG } from "../utils/dynamicConfig";
import { BacklogService } from "../utils/BacklogService";

export default function SpListTab() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.sp);
  const backlogService = new BacklogService();

  React.useEffect(() => {
    dispatch(fetchSpItems() as any);
  }, [dispatch]);

  const handleAdd = async (p: {
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
    sourceRow: any;
  }) => {
    console.log(p);
    backlogService.createWorkItem({
      title: "Test Item",
      description: "Auto created from SPFx",
    });
  };

  return (
    <GenericTab
      rows={items}
      loading={loading}
      error={error}
      config={SP_TAB_CONFIG}
      onAddToBacklog={handleAdd}
    />
  );
}
