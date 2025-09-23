import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.investarbd.com';
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('auth_token');
      Alert.alert('Session Expired', 'Please login again');
    } else if (error.response?.status >= 500) {
      Alert.alert('Server Error', 'Something went wrong. Please try again later.');
    } else if (!error.response) {
      Alert.alert('Network Error', 'Please check your internet connection.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    await SecureStore.deleteItemAsync('auth_token');
  },
};

// Portfolio API
export const portfolioAPI = {
  getPortfolio: async () => {
    const response = await apiClient.get('/portfolio');
    return response.data;
  },

  getInvestments: async () => {
    const response = await apiClient.get('/investments');
    return response.data;
  },

  buyInvestment: async (investmentData: {
    symbol: string;
    quantity: number;
    type: string;
  }) => {
    const response = await apiClient.post('/investments/buy', investmentData);
    return response.data;
  },

  sellInvestment: async (investmentData: {
    investmentId: string;
    quantity: number;
  }) => {
    const response = await apiClient.post('/investments/sell', investmentData);
    return response.data;
  },
};

// Market Data API
export const marketAPI = {
  getMarketData: async () => {
    const response = await apiClient.get('/market/data');
    return response.data;
  },

  getAssetPrice: async (symbol: string) => {
    const response = await apiClient.get(`/market/price/${symbol}`);
    return response.data;
  },

  searchAssets: async (query: string) => {
    const response = await apiClient.get(`/market/search?q=${query}`);
    return response.data;
  },
};

// Wallet API
export const walletAPI = {
  getBalances: async () => {
    const response = await apiClient.get('/wallet/balances');
    return response.data;
  },

  getTransactions: async () => {
    const response = await apiClient.get('/wallet/transactions');
    return response.data;
  },

  deposit: async (amount: number, currency: string) => {
    const response = await apiClient.post('/wallet/deposit', { amount, currency });
    return response.data;
  },

  withdraw: async (amount: number, currency: string) => {
    const response = await apiClient.post('/wallet/withdraw', { amount, currency });
    return response.data;
  },

  transfer: async (transferData: {
    toAddress: string;
    amount: number;
    currency: string;
  }) => {
    const response = await apiClient.post('/wallet/transfer', transferData);
    return response.data;
  },
};

// Learning API
export const learningAPI = {
  getLearningModules: async () => {
    const response = await apiClient.get('/learning/modules');
    return response.data;
  },

  getModuleContent: async (moduleId: string) => {
    const response = await apiClient.get(`/learning/modules/${moduleId}`);
    return response.data;
  },

  updateProgress: async (moduleId: string, progress: number) => {
    const response = await apiClient.post(`/learning/modules/${moduleId}/progress`, {
      progress,
    });
    return response.data;
  },

  getRecommendations: async () => {
    const response = await apiClient.get('/learning/recommendations');
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await apiClient.put('/user/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await apiClient.post('/user/change-password', passwordData);
    return response.data;
  },

  uploadAvatar: async (imageUri: string) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await apiClient.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  setAuthToken: async (token: string) => {
    await SecureStore.setItemAsync('auth_token', token);
  },

  getAuthToken: async () => {
    return await SecureStore.getItemAsync('auth_token');
  },

  clearAuthToken: async () => {
    await SecureStore.deleteItemAsync('auth_token');
  },

  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    return !!token;
  },
};

export default apiClient;