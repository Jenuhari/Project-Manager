import React, { useState } from "react";
import Sidebar from "../components/SideBar";

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <main
        className="app-content"
        style={{
          marginLeft: collapsed ? 72 : 260,
          transition: "margin-left 260ms ease",
        }}
      >
        {children}
      </main>
    </div>
  );
}
