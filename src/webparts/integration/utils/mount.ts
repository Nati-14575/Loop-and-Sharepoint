import * as React from "react";
import * as ReactDOM from "react-dom";

// Try to load react-dom/client at runtime (React 18). If not present, fallback (React 17).
let client: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  client = require("react-dom/client");
} catch {
  client = null;
}

export type RootHandle = {
  render: (element: React.ReactElement) => void;
  unmount: () => void;
};

export function createMount(container: Element): RootHandle {
  if (client?.createRoot) {
    const root = client.createRoot(container);
    return {
      render: (el) => root.render(el),
      unmount: () => root.unmount(),
    };
  }

  return {
    render: (el) => ReactDOM.render(el, container),
    unmount: () => ReactDOM.unmountComponentAtNode(container),
  };
}
