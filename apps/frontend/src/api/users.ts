import client from './client';
import type { User, UserCreateRequest} from '../types';

export const userApi = {

  getAll: async () => {
    const response = await client.get<User[]>('/users');
    return response.data;
  },

  create: async (userData: UserCreateRequest) => {
    const response = await client.post<{ message: string; user: User }>('/users', userData);
    return response.data.user;
  },

  getById: async (id: string) => {
    const response = await client.get<User>(`/users/${id}`);
    return response.data;
  },
};
