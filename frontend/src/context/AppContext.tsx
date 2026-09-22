import React, { createContext, useContext, useState } from 'react';

export interface AppContextType {
  currentRole: string;
  setRole: (role: string) => void;
  currentWorkspace: string;
  setWorkspace: (workspace: string) => void;
  hasPermission: (permission: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setRoleState] = useState<string>(() => {
    return localStorage.getItem('kite_role') || 'Admin';
  });
  
  const [currentWorkspace, setWorkspaceState] = useState<string>(() => {
    return localStorage.getItem('kite_workspace') || 'main';
  });

  const setRole = (role: string) => {
    setRoleState(role);
    localStorage.setItem('kite_role', role);
  };

  const setWorkspace = (workspace: string) => {
    setWorkspaceState(workspace);
    localStorage.setItem('kite_workspace', workspace);
  };

  // Role-based permission mapping:
  // - Admin: all permissions
  // - InstituteAdmin: everything except core settings/ explore plans
  // - Teacher: courses, learning manager, newsfeed, chat (no billing, no CRM, no system roles)
  // - Student: very limited view
  const hasPermission = (permission: string): boolean => {
    if (currentRole === 'Admin') return true;
    if (currentRole === 'InstituteAdmin') {
      return !permission.startsWith('settings') && !permission.startsWith('explore-plans');
    }
    if (currentRole === 'Teacher') {
      const allowed = ['courses', 'learning-manager', 'social-connect'];
      return allowed.some(prefix => permission.startsWith(prefix));
    }
    if (currentRole === 'Student') {
      const allowed = ['social-connect', 'courses-view'];
      return allowed.some(prefix => permission.startsWith(prefix));
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole,
        currentWorkspace,
        setWorkspace,
        hasPermission,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
export default AppContext;
