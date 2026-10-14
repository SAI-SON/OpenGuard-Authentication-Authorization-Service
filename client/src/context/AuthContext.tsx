import React, { createContext, useContext, useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "developer" | "security_auditor";
  avatarUrl?: string;
  isDemoUser: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginDemo: (email: string, role?: AuthUser["role"]) => void;
  logout: () => void;
  authMode: "auth0" | "demo";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Default demo user so user can explore dashboard immediately
    return {
      id: "usr_admin_01",
      name: "Alex Vance",
      email: "alex.vance@openguard.io",
      role: "admin",
      isDemoUser: true,
    };
  });

  const loginDemo = (email: string, role: AuthUser["role"] = "admin") => {
    const name = email.split("@")[0].replace(/[._]/g, " ");
    setUser({
      id: `usr_demo_${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      role,
      isDemoUser: true,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginDemo,
        logout,
        authMode: "demo",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
