import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { getOrCreateUserToken, generateDisplayName } from '../utils/encryption';
import { createOrGetToken } from '../db/mockApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const token = getOrCreateUserToken();
      const { data, error } = await createOrGetToken(token);

      if (!error && data) {
        setUser({
          ...data,
          displayName: generateDisplayName(token),
        });
      }
    } catch (err) {
      console.error('Auth init failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const value = {
    user,
    loading,
    updateProfile,
    token: user?.token || getOrCreateUserToken(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
