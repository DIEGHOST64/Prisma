import axios from 'axios';
import { recruitmentAPI } from './api';
import type { Vacancy } from '../types';

const API_URL = 'http://52.0.197.30:3002/api';

export interface VacancyFull {
  uuid?: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  requirements: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const vacancyService = {
  // Get all vacancies (active and inactive)
  getAllVacancies: async (): Promise<VacancyFull[]> => {
    try {
      const response = await recruitmentAPI.get('/vacancies');
      return response.data.data.vacancies || [];
    } catch (error) {
      console.error('Error fetching all vacancies:', error);
      throw error;
    }
  },

  // Get only active vacancies
  getActiveVacancies: async (): Promise<Vacancy[]> => {
    try {
      const response = await axios.get(`${API_URL}/vacancies/active`);
      return response.data.data.vacancies || [];
    } catch (error) {
      console.error('Error fetching active vacancies:', error);
      throw error;
    }
  },

  // Get vacancy by ID
  getVacancyById: async (id: string): Promise<Vacancy> => {
    try {
      const response = await axios.get(`${API_URL}/vacancies/${id}`);
      return response.data.data.vacancy;
    } catch (error) {
      console.error('Error fetching vacancy by ID:', error);
      throw error;
    }
  },

  // Create a new vacancy
  createVacancy: async (vacancyData: VacancyFull): Promise<VacancyFull> => {
    try {
      const response = await recruitmentAPI.post('/vacancies', vacancyData);
      return response.data.data.vacancy;
    } catch (error) {
      console.error('Error creating vacancy:', error);
      throw error;
    }
  },

  // Update a vacancy
  updateVacancy: async (uuid: string, vacancyData: Partial<VacancyFull>): Promise<VacancyFull> => {
    try {
      const response = await recruitmentAPI.put(`/vacancies/${uuid}`, vacancyData);
      return response.data.data.vacancy;
    } catch (error) {
      console.error('Error updating vacancy:', error);
      throw error;
    }
  },

  // Toggle vacancy active status
  toggleVacancyStatus: async (uuid: string, isActive: boolean): Promise<VacancyFull> => {
    try {
      const response = await recruitmentAPI.put(`/vacancies/${uuid}`, { isActive });
      return response.data.data.vacancy;
    } catch (error) {
      console.error('Error toggling vacancy status:', error);
      throw error;
    }
  },

  // Delete a vacancy
  deleteVacancy: async (uuid: string): Promise<void> => {
    try {
      await recruitmentAPI.delete(`/vacancies/${uuid}`);
    } catch (error) {
      console.error('Error deleting vacancy:', error);
      throw error;
    }
  }
};