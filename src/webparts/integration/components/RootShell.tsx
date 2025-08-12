import * as React from "react";
import App from "./App";
import { Providers } from "../store/Provider";
import { WebPartContext } from "@microsoft/sp-webpart-base";

type Props = { spfx: { context: WebPartContext } };

const RootShell: React.FC<Props> = ({ spfx }) => {
  return (
    <Providers spfx={spfx}>
      <App />
    </Providers>
  );
};

export default RootShell;
