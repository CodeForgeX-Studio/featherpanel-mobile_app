import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  SessionResponse,
  ApiEnvelope,
} from '@/types/api';
import { createApiClient, handleApiError } from '@/lib/api';

interface AppState {
  instanceUrl: string | null;
  authToken: string | null;
  user: User | null;
  isLoading: boolean;
}

const STORAGE_KEYS = {
  INSTANCE_URL: 'featherpanel_instance_url',
  AUTH_TOKEN: 'featherpanel_auth_token',
  USER: 'featherpanel_user',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [state, setState] = useState<AppState>({
    instanceUrl: null,
    authToken: null,
    user: null,
    isLoading: true,
  });

  const [apiClient, setApiClient] = useState<AxiosInstance | null>(null);
  const queryClient = useQueryClient();

  const storageQuery = useQuery({
    queryKey: ['appStorage'],
    queryFn: async () => {
      try {
        const [instanceUrl, authToken, userStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.INSTANCE_URL),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);

        return {
          instanceUrl: instanceUrl || null,
          authToken: authToken || null,
          user: userStr ? (JSON.parse(userStr) as User) : null,
        };
      } catch (error) {
        console.error('Failed to load storage:', error);
        return {
          instanceUrl: null,
          authToken: null,
          user: null,
        };
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (storageQuery.data && !storageQuery.isLoading) {
      setState({
        instanceUrl: storageQuery.data.instanceUrl,
        authToken: storageQuery.data.authToken,
        user: storageQuery.data.user,
        isLoading: false,
      });
    }
  }, [storageQuery.data, storageQuery.isLoading]);

  const setInstanceUrl = useCallback(async (url: string) => {
    let cleanUrl = url.trim();

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    cleanUrl = cleanUrl.replace(/\/+$/, '');

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INSTANCE_URL, cleanUrl);
      setState((prev) => ({ ...prev, instanceUrl: cleanUrl }));
      await queryClient.invalidateQueries({ queryKey: ['appStorage'] });
    } catch (error) {
      console.error('Failed to save instance URL:', error);
      throw error;
    }
  }, [queryClient]);

  const setAuth = useCallback(async (cookieHeader: string, user: User) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, cookieHeader),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);
      setState((prev) => ({ ...prev, authToken: cookieHeader, user }));
      await queryClient.invalidateQueries({ queryKey: ['appStorage'] });
    } catch (error) {
      console.error('Failed to save auth:', error);
      throw error;
    }
  }, [queryClient]);

  const clearAuth = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
      setState((prev) => ({ ...prev, authToken: null, user: null }));
      await queryClient.invalidateQueries({ queryKey: ['appStorage'] });
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }, [queryClient]);

  const clearAll = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.INSTANCE_URL,
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER,
      ]);
      setState({
        instanceUrl: null,
        authToken: null,
        user: null,
        isLoading: false,
      });
      await queryClient.invalidateQueries({ queryKey: ['appStorage'] });
    } catch (error) {
      console.error('Failed to clear all:', error);
    }
  }, [queryClient]);

  useEffect(() => {
    if (state.instanceUrl) {
      const cleanUrl = state.instanceUrl.replace(/\/$/, '');

      const client = axios.create({
        baseURL: cleanUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
        withCredentials: true,
      });

      client.interceptors.request.use(
        (config) => {
          if (state.authToken) {
            config.headers['Cookie'] = state.authToken;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      client.interceptors.response.use(
        (response) => {
          return response;
        },
        async (error: AxiosError) => {
          if (error.response?.status === 401 && state.authToken) {
            await clearAuth().catch(() => undefined);
          }
          return Promise.reject(error);
        }
      );

      setApiClient(client);
    } else {
      setApiClient(null);
    }
  }, [state.instanceUrl, state.authToken, clearAuth]);

  const fetchSession = useCallback(async (): Promise<SessionResponse | null> => {
    if (!state.instanceUrl || !state.authToken) {
      return null;
    }

    try {
      const client = createApiClient(state.instanceUrl, state.authToken);
      const res = await client.get<SessionResponse>('/api/user/session');
      const data = res.data;

      if (data.success && !data.error && data.data && data.data.user_info) {
        const userInfo = data.data.user_info as User;
        setState((prev) => ({ ...prev, user: userInfo }));
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));
      }

      return data;
    } catch (error: any) {
      const msg = handleApiError(error);
      if (error.response?.status === 401) {
        await clearAuth();
      }
      throw new Error(msg);
    }
  }, [state.instanceUrl, state.authToken, clearAuth]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (state.instanceUrl && state.authToken && !state.isLoading) {
      fetchSession().catch((e) => {});
      
      interval = setInterval(() => {
        fetchSession().catch((e) => {});
      }, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.instanceUrl, state.authToken, state.isLoading, fetchSession]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      if (!state.instanceUrl) {
        throw new Error('Instance URL not set');
      }

      const cleanUrl = state.instanceUrl.replace(/\/$/, '');

      const client = axios.create({
        baseURL: cleanUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
        withCredentials: true,
      });

      try {
        const response = await client.put<LoginResponse>('/api/user/auth/login', {
          username_or_email: credentials.username_or_email,
          password: credentials.password,
          turnstile_token: credentials.turnstile_token || '',
        });

        const setCookie = response.headers['set-cookie'];

        if (setCookie && Array.isArray(setCookie) && setCookie.length > 0) {
          const raw = setCookie[0];
          const cookieHeader = raw.split(';')[0] + ';';

          if (response.data.success && !response.data.error && response.data.data && response.data.data.user) {
            const user = response.data.data.user as User;
            await setAuth(cookieHeader, user);
          }
        }

        return response.data;
      } catch (error: any) {
        const msg = handleApiError(error);
        throw new Error(msg);
      }
    },
    onSuccess: async (data) => {
      if (data.success && !data.error && data.data && data.data.user) {
        await fetchSession().catch((e) => {});
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest): Promise<ApiEnvelope<unknown>> => {
      if (!state.instanceUrl) {
        throw new Error('Instance URL not set');
      }

      const cleanUrl = state.instanceUrl.replace(/\/$/, '');

      const client = axios.create({
        baseURL: cleanUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      });

      try {
        const response = await client.put<ApiEnvelope<unknown>>('/api/user/auth/register', data);
        return response.data;
      } catch (error: any) {
        const msg = handleApiError(error);
        throw new Error(msg);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!state.instanceUrl || !state.authToken) {
        return;
      }

      const url = `${state.instanceUrl.replace(/\/$/, '')}/api/user/auth/logout`;
      await axios.get(url, {
        headers: {
          Cookie: state.authToken,
        },
      });
    },
    onSuccess: async () => {
      await clearAuth();
    },
  });

  const canChangeInstanceUrl = !state.authToken;

  return {
    ...state,
    apiClient,
    canChangeInstanceUrl,
    setInstanceUrl,
    setAuth,
    clearAuth,
    clearAll,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    fetchSession,
  };
});