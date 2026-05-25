import client from './client';
import type { AuthResponse, SignupRequest, SignupResponse, User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  signup: async (request: SignupRequest) => {
    const response = await client.post<SignupResponse>('/auth/signup', request);
    return response.data;
  },

  getMe: async () => {
    const response = await client.get<{ user: User }>('/auth/me');
    return response.data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};
