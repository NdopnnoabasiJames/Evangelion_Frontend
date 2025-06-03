import { useState, useEffect } from 'react';
import api from '../services/api';

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    immediate = true,
    method = 'GET',
    body = null,
    dependencies = []
  } = options;

  const execute = async (customEndpoint = null, customOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const url = customEndpoint || endpoint;
      const requestMethod = customOptions.method || method;
      const requestBody = customOptions.body || body;

      let response;
      
      switch (requestMethod.toUpperCase()) {
        case 'GET':
          response = await api.get(url);
          break;
        case 'POST':
          response = await api.post(url, requestBody);
          break;
        case 'PUT':
          response = await api.put(url, requestBody);
          break;
        case 'PATCH':
          response = await api.patch(url, requestBody);
          break;
        case 'DELETE':
          response = await api.delete(url);
          break;
        default:
          throw new Error(`Unsupported method: ${requestMethod}`);
      }

      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate && endpoint) {
      execute();
    }
  }, [endpoint, immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: () => execute()
  };
};

export default useApi;
