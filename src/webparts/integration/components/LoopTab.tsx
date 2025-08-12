import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchLoopItems } from "../store/loopSlice";
import GenericTab from "./GenericTab";
import { LOOP_TAB_CONFIG } from "../utils/dynamicConfig";
import { BacklogService } from "../utils/BacklogService";
import { getSpfxCtx } from "../utils/spfxCtx";

export default function LoopTab() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.loop);

  React.useEffect(() => {
    dispatch(fetchLoopItems() as any);
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
      source: "Loop",
    });
  };

  return (
    <GenericTab
      rows={items}
      loading={loading}
      error={error}
      config={LOOP_TAB_CONFIG}
      onAddToBacklog={handleAdd}
    />
  );
}
