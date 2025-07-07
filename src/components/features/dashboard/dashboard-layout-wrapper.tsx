'use client';

import { useState, createContext, useContext } from 'react';
import { DashboardNavigation } from '@/components/layout/dashboard-navigation';

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
      'useNavigationContext must be used within NavigationProvider'
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
      <div className='min-h-screen bg-[var(--neutral-50)]'>
        <DashboardNavigation />
        <main
          className={`
            min-h-screen transition-all duration-300 ease-in-out
            ${isExpanded ? 'lg:ml-64' : 'lg:ml-20'}
          `}
        >
          <div className='p-6 pt-20 lg:pt-6'>{children}</div>
        </main>
      </div>
    </NavigationContext.Provider>
  );
}
