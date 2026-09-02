import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/raceApi';

export function useAdminAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!localStorage.getItem('admin_token');

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.login(email, password);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_email', data.email);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin/login');
  }, [navigate]);

  return { isAuthenticated, login, logout, loading, error };
}
