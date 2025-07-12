import { API_ENDPOINTS } from '../utils/constants';
import api from './api';

class WorkerService {
  async getPendingWorkers() {
    try {
      console.log('🔄 WorkerService.getPendingWorkers called');
      console.log('🌐 Making request to:', API_ENDPOINTS.WORKERS.PENDING);
      
      const response = await api.get(API_ENDPOINTS.WORKERS.PENDING);
      console.log('✅ Workers data received:', response.data);
      
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      console.error('❌ Error fetching pending workers:', error);
      console.error('📋 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getApprovedWorkers() {
    try {
      console.log('🔄 WorkerService.getApprovedWorkers called');
      
      const response = await api.get(API_ENDPOINTS.WORKERS.APPROVED);
      console.log('✅ Approved workers data received:', response.data);
      
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      console.error('❌ Error fetching approved workers:', error);
      throw error;
    }
  }

  async approveWorker(workerId) {
    try {
      const response = await api.post(`${API_ENDPOINTS.WORKERS.BASE}/approve/${workerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error approving worker:', error);
      throw error;
    }
  }

  async rejectWorker(workerId) {
    try {
      const response = await api.delete(`${API_ENDPOINTS.WORKERS.BASE}/reject/${workerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error rejecting worker:', error);
      throw error;
    }
  }
}

export default new WorkerService();
