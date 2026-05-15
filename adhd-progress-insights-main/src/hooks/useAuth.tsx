import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'Admin' | 'Doctor' | 'Parent' | null;

interface AuthContextType {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    // Check local storage on mount
    const savedRole = localStorage.getItem('userRole') as Role;
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  const login = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole || '');
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ role, login, logout, isAuthenticated: !!role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
