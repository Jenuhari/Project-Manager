// src/layouts/AppLayout.jsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/SideBar";
import "../components/SideBar.css";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();

  // keep activeSidebar in sync with current path (basic)
  React.useEffect(() => {
    const path = location.pathname || "/";
    if (path.startsWith("/projects")) setActiveSidebar("projects");
    else if (path.startsWith("/tasks")) setActiveSidebar("tasks");
    else if (path.startsWith("/users")) setActiveSidebar("users");
    else if (path.startsWith("/activity-logs") || path.startsWith("/logs"))
      setActiveSidebar("activity-logs");
    else if (path.startsWith("/profile")) setActiveSidebar("profile");
    else setActiveSidebar("dashboard");
  }, [location.pathname]);

  const handleNavigate = (key) => {
    setActiveSidebar(key);
    if (key === "logout") {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }
    const map = {
      dashboard: "/dashboard",
      projects: "/projects",
      tasks: "/tasks",
      users: "/users",
      logs: "/activity-logs",
      profile: "/profile",
    };
    if (map[key]) navigate(map[key]);
  };

  const handleSearch = (q) => {
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleBack = () => {
    // if there is history, go back, otherwise go to dashboard
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  const handleRefresh = () => {
    // simplest: reload the current route
    window.location.reload();
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        active={activeSidebar}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
      />

      <main
        className="app-content"
        style={{
          marginLeft: collapsed ? 72 : 260,
          transition: "margin-left 260ms ease",
          minHeight: "100vh",
        }}
      >
        {/* Back + Refresh bar – same place on every page */}
        <div className="container-fluid pt-3">
          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary me-2"
              onClick={handleBack}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleRefresh}
            >
              Refresh
            </button>
          </div>

          {/* actual page content */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
