// src/components/SideBar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SideBar.css";

export default function Sidebar({
  collapsed = false,
  onToggle = () => {},
  active, // optional: if not passed, we derive from URL
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 local state for the search text
  const [searchTerm, setSearchTerm] = React.useState("");

  // 🔵 Derive which item is active from the current URL
  const derivedActive = React.useMemo(() => {
    const path = location.pathname || "/";

    if (path.startsWith("/tasks")) return "tasks";
    if (path.startsWith("/users")) return "users";
    if (path.startsWith("/activity-logs") || path.startsWith("/logs"))
      return "activity-logs";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/projects") || path.startsWith("/project"))
      return "projects";
    if (path.startsWith("/dashboard")) return "dashboard";

    // default fallback
    return "dashboard";
  }, [location.pathname]);

  // Use prop if parent passes it, otherwise use the URL-based one
  const currentActive = active || derivedActive;

  const navTo = (key) => {
    if (key === "logout") {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    const map = {
      dashboard: "/dashboard",
      projects: "/projects", // list of projects lives on dashboard
      tasks: "/tasks",
      users: "/users",
      logs: "/activity-logs",
      "activity-logs": "/activity-logs",
      profile: "/profile",
    };

    if (map[key]) navigate(map[key]);
  };

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M3 11.5L12 4l9 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 21V12h14v9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "projects",
      label: "Projects",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
            stroke="currentColor"
            strokeWidth="1.5"
            rx="1"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="7"
            stroke="currentColor"
            strokeWidth="1.5"
            rx="1"
          />
          <rect
            x="14"
            y="14"
            width="7"
            height="7"
            stroke="currentColor"
            strokeWidth="1.5"
            rx="1"
          />
          <rect
            x="3"
            y="14"
            width="7"
            height="7"
            stroke="currentColor"
            strokeWidth="1.5"
            rx="1"
          />
        </svg>
      ),
    },
    {
      key: "tasks",
      label: "Tasks",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M9 11l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "users",
      label: "Users",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M23 21v-2a4 4 0 0 0-3-3.87"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "activity-logs",
      label: "Activity Logs",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M3 12h3l3 8 4-16 3 8h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "profile",
      label: "My Profile",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M6 20c1.5-3 4.5-5 6-5s4.5 2 6 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  // 🔹 Handle Enter in search box
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = searchTerm.trim();
      if (term) {
        navigate(`/search?q=${encodeURIComponent(term)}`);
      }
    }
  };

  return (
    <>
      {/* Burger button */}
      <button
        className={`sidebar-toggle-btn ${collapsed ? "collapsed" : ""}`}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        onClick={onToggle}
      >
        <span className="burger" aria-hidden />
      </button>

      {/* Sidebar */}
      <aside
        className={`sidebar ${collapsed ? "collapsed" : "expanded"}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-top">
          {!collapsed && (
            <div className="search-wrap">
              <input
                className="search-input"
                placeholder="Search"
                aria-label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar navigation">
          <ul>
            {navItems.map((it) => (
              <li
                key={it.key}
                className={currentActive === it.key ? "active" : ""}
              >
                <button
                  className="nav-btn"
                  onClick={() => navTo(it.key)}
                  aria-current={currentActive === it.key ? "page" : undefined}
                >
                  <span className="nav-icon" aria-hidden>
                    {it.icon}
                  </span>
                  <span className="nav-label">{it.label}</span>
                </button>
              </li>
            ))}

            <li className="mt-auto">
              <button
                className="nav-btn logout"
                onClick={() => navTo("logout")}
              >
                <span className="nav-icon" aria-hidden>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 17l5-5-5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12H9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="nav-label">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
