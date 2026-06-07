import { useState, useCallback } from 'react';
import axios from '../api/axios';

export const useAdminProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the current profile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/users/admin/profile/');
      setUser(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update the profile
  const updateProfile = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch('/users/admin/profile/', data);
      setUser(response.data);  // Update local state immediately
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to update profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    user, 
    loading, 
    error, 
    fetchProfile, 
    updateProfile 
  };
};