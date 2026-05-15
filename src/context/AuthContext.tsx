import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GoogleUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (isOpen: boolean) => void;
  // Google user state
  googleUser: GoogleUser | null;
  setGoogleUser: (user: GoogleUser | null) => void;
  isGoogleUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [googleUser, setGoogleUserState] = useState<GoogleUser | null>(() => {
    const stored = localStorage.getItem('google_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }, [token]);

  useEffect(() => {
    if (googleUser) {
      localStorage.setItem('google_user', JSON.stringify(googleUser));
    } else {
      localStorage.removeItem('google_user');
    }
  }, [googleUser]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setGoogleUserState(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('google_user');
  };

  const setGoogleUser = (user: GoogleUser | null) => {
    setGoogleUserState(user);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        login,
        logout,
        isLoginModalOpen,
        setLoginModalOpen,
        googleUser,
        setGoogleUser,
        isGoogleUser: !!googleUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
