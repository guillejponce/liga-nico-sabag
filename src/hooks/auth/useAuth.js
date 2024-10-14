import { useState, useEffect } from 'react';
import { pb } from '../../config';

const useAuth = () => {
  const [user, setUser] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if there's an existing session
    if (pb.authStore.isValid) {
      setUser(pb.authStore.model);
      setIsAdmin(pb.authStore.model?.role === 'admin');
    } else {
      setUser(null);
    }

    // Listen for authentication state changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model || null);
      setIsAdmin(model?.role === 'admin' || false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setUser(authData.record);
    setIsAdmin(authData.record.role === 'admin');
    return authData;
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
    setIsAdmin(false);
  };

  return { user, isAdmin, login, logout };
};

export default useAuth;