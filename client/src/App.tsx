import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.js";
import { AuthProvider } from "./context/AuthContext.js";
import { DashboardLayout } from "./components/layout/DashboardLayout.js";

// Pages
import { LandingPage } from "./pages/LandingPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { SignupPage } from "./pages/SignupPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { PlaygroundPage } from "./pages/PlaygroundPage.js";
import { PermissionsPage } from "./pages/PermissionsPage.js";
import { UsersPage } from "./pages/UsersPage.js";
import { LogsPage } from "./pages/LogsPage.js";
import { DocsPage } from "./pages/DocsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing & Auth Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Authenticated / Console Pages (wrapped in DashboardLayout) */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/permissions" element={<PermissionsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
