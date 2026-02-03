import axios, { AxiosInstance } from 'axios';
import { ApiEnvelope } from '@/types/api';

export const createApiClient = (baseURL: string, authToken?: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Cookie: `remember_token=${authToken}` }),
    },
    timeout: 15000,
    withCredentials: true,
  });

  client.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return client;
};

export const extractApiMessage = <T = unknown>(envelope: Partial<ApiEnvelope<T>>): string | undefined => {
  if (!envelope) {
    return undefined;
  }

  const messageFromErrors =
    Array.isArray(envelope.errors) && envelope.errors.length > 0
      ? envelope.errors[0]?.detail || envelope.errors[0]?.status?.toString()
      : undefined;

  return envelope.error_message || envelope.message || messageFromErrors;
};

export const handleApiError = (error: any): string => {
  if (error.response) {
    const data = (error.response.data || {}) as Partial<ApiEnvelope<unknown>>;
    return extractApiMessage(data) || `Error: ${error.response.status}`;
  } else if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection and instance URL.';
    }
    return 'No response from server. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};

export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401;
};