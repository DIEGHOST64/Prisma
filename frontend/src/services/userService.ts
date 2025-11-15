import { authAPI } from './api';

export interface User {
  uuid?: string;
  email: string;
  name?: string;
  password?: string;
  role: 'admin' | 'recruiter';
  createdAt?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'recruiter';
}

export const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    console.log('🔍 Llamando a GET /users...');
    const response = await authAPI.get('/users');
    console.log('📡 Response completa:', response);
    console.log('📦 Response.data:', response.data);
    
    // El backend devuelve: { success: true, data: { users: [...], total: X } }
    const responseData = response.data.data || response.data;
    const users = responseData.users || responseData;
    
    console.log('🎯 Users extraídos:', users);
    console.log('🔢 Es array?', Array.isArray(users), 'Length:', users?.length);
    
    return Array.isArray(users) ? users : [];
  },

  // Create a new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    try {
      const response = await authAPI.post('/users', userData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (uuid: string, role: 'admin' | 'recruiter'): Promise<User> => {
    try {
      console.log('🔄 Updating role for UUID:', uuid, 'to role:', role);
      const endpoint = `/users/${uuid}/role`;
      console.log('📍 Endpoint:', endpoint);
      const response = await authAPI.put(endpoint, { role });
      console.log('✅ Role updated successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (uuid: string): Promise<void> => {
    try {
      await authAPI.delete(`/users/${uuid}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};
