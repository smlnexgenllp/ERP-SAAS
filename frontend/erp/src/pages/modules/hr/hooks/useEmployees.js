// src/hr/hooks/useEmployees.js
import { useEffect, useState, useCallback } from 'react';
import { fetchEmployees } from '../api/hrApi';

export default function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { employees, loading, error, reload: load };
}
