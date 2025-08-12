import type { WebPartContext } from "@microsoft/sp-webpart-base";

let _ctx: WebPartContext | null = null;

export function setSpfxCtx(ctx: WebPartContext) {
  _ctx = ctx;
}

export function getSpfxCtx(): WebPartContext {
  if (!_ctx) throw new Error("SPFx context not set");
  return _ctx;
}
