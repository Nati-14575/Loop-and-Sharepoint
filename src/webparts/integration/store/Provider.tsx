import * as React from "react";
import { Provider } from "react-redux";
import { store, setSpfxCtx } from "./store";
import "../index.css";

import { SpfxContext } from "../utils/SpfxContext";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export const Providers: React.FC<{
  spfx: { context: WebPartContext };
  children: React.ReactNode;
}> = ({ spfx, children }) => {
  setSpfxCtx(spfx.context);
  return (
    <SpfxContext.Provider value={spfx.context}>
      <Provider store={store}>{children}</Provider>
    </SpfxContext.Provider>
  );
};
