import * as React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchLoopItems } from "../store/loopSlice";
import GenericTab from "./GenericTab";
import { LOOP_TAB_CONFIG } from "../utils/dynamicConfig";
import { BacklogService } from "../utils/BacklogService";

export default function LoopTab() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.loop);
  const backlogService = new BacklogService();
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
      config={LOOP_TAB_CONFIG}
      onAddToBacklog={handleAdd}
    />
  );
}
