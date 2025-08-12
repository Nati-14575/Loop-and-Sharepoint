import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchSpItems } from "../store/spSlice";
import GenericTab from "./GenericTab";
import { SP_TAB_CONFIG } from "../utils/dynamicConfig";
import { BacklogService } from "../utils/BacklogService";
import { getSpfxCtx } from "../utils/spfxCtx";

export default function SpListTab() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.sp);

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
    const svc = new BacklogService(getSpfxCtx());
    await svc.createWorkItem({
      title: p.title,
      description: p.description,
      priority: p.priority,
      assignee: p.assignee,
      sourceId: p.sourceRow.id,
      source: "SharePoint",
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
