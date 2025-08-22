import * as React from "react";
import HeaderBar from "./HeaderBar";
import SpListTab from "./SpListTab";

export default function App() {
  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg">
      <HeaderBar />

      <div className="mt-4">
        <SpListTab />
      </div>
    </div>
  );
}
