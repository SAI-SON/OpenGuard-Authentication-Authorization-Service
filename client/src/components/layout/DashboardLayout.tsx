import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import { fetchHealth } from "../../api/client.js";

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);

  // Poll health status
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const res = await fetchHealth();
      if (mounted) {
        setBackendHealthy(res.status === "ok");
      }
    };
    check();
    const timer = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        backendHealthy={backendHealthy}
      />

      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="py-4 px-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400 dark:text-slate-500">
          OpenGuard Authorization & Authentication Platform — Backend running on port 8080
        </footer>
      </div>
    </div>
  );
};
