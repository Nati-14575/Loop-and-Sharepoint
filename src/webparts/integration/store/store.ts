import { configureStore } from "@reduxjs/toolkit";
import loopReducer from "./loopSlice";
import spReducer from "./spSlice";
import uiReducer from "./uiSlice";
import { WebPartContext } from "@microsoft/sp-webpart-base";

// little trick: we’ll swap extraArgument at runtime from Providers
let _ctx: WebPartContext | null = null;
export const setSpfxCtx = (ctx: WebPartContext) => {
  _ctx = ctx;
};

export const store = configureStore({
  reducer: { loop: loopReducer, sp: spReducer, ui: uiReducer },
  middleware: (getDefault) =>
    getDefault({
      thunk: {
        extraArgument: {
          ctx: () => {
            if (!_ctx) throw new Error("SPFx context not set");
            return _ctx;
          },
        },
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type ExtraArg = { ctx: () => WebPartContext };
