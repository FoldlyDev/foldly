"use client";

import { useState, createContext, useContext } from "react";
import { DashboardNavigation } from "./DashboardNavigation";

interface NavigationContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "useNavigationContext must be used within NavigationProvider"
    );
  }
  return context;
};

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <NavigationContext.Provider value={{ isExpanded, setIsExpanded }}>
      <div className="dashboard-layout-wrapper">
        {/* Subtle gradient overlay for depth */}
        <div className="dashboard-gradient-overlay" />
        <DashboardNavigation />
        <main
          className={`dashboard-main ${
            isExpanded ? "dashboard-main-expanded" : "dashboard-main-collapsed"
          }`}
        >
          <div className="dashboard-content">{children}</div>
        </main>
      </div>
    </NavigationContext.Provider>
  );
}
