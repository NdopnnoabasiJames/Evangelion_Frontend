import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const registrarVolunteerService = {
  // Get volunteer statistics
  async getVolunteerStats() {
    try {
      const response = await api.get(API_ENDPOINTS.REGISTRARS.VOLUNTEER_STATS);
      return response.data;
    } catch (error) {
      console.error('Error fetching volunteer stats:', error);
      throw error;
    }
  },

  // Get all events available for volunteering
  async getAllEvents() {
    try {
      const response = await api.get(API_ENDPOINTS.REGISTRARS.VOLUNTEER_EVENTS);
      return response.data;
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  },

  // Get registrar's approved volunteer events
  async getMyEvents() {
    try {
      const response = await api.get(API_ENDPOINTS.REGISTRARS.VOLUNTEER_MY_EVENTS);
      return response.data;
    } catch (error) {
      console.error('Error fetching my events:', error);
      throw error;
    }
  },

  // Volunteer for an event
  async volunteerForEvent(eventId) {
    try {
      const response = await api.post(`${API_ENDPOINTS.REGISTRARS.VOLUNTEER_FOR_EVENT}/${eventId}/volunteer`);
      return response.data;
    } catch (error) {
      console.error('Error volunteering for event:', error);
      throw error;
    }
  },

  // Get guests for a specific event
  async getEventGuests(eventId) {
    try {
      const response = await api.get(`${API_ENDPOINTS.REGISTRARS.VOLUNTEER_EVENT_GUESTS}/${eventId}/guests`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event guests:', error);
      throw error;
    }
  },

  // Search guests by phone number
  async searchGuestsByPhone(eventId, phone) {
    try {
      const response = await api.get(`${API_ENDPOINTS.REGISTRARS.VOLUNTEER_EVENT_GUESTS}/${eventId}/guests/search?phone=${phone}`);
      return response.data;
    } catch (error) {
      console.error('Error searching guests:', error);
      throw error;
    }
  },

  // Check in a guest
  async checkInGuest(eventId, guestId) {
    try {
      const response = await api.post(`${API_ENDPOINTS.REGISTRARS.VOLUNTEER_CHECKIN}/${eventId}/guests/${guestId}/checkin`);
      return response.data;
    } catch (error) {
      console.error('Error checking in guest:', error);
      throw error;
    }
  }
};

export const registrarApprovalService = {
  // Get pending volunteer requests (for Branch Admins)
  async getPendingVolunteerRequests() {
    try {
      const response = await api.get(API_ENDPOINTS.REGISTRARS.PENDING_VOLUNTEER_REQUESTS);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending volunteer requests:', error);
      throw error;
    }
  },

  // Approve a volunteer request
  async approveVolunteerRequest(eventId, registrarId) {
    try {
      const response = await api.post(`${API_ENDPOINTS.REGISTRARS.APPROVE_VOLUNTEER_REQUEST}/${eventId}/approve/${registrarId}`);
      return response.data;
    } catch (error) {
      console.error('Error approving volunteer request:', error);
      throw error;
    }
  },

  // Reject a volunteer request
  async rejectVolunteerRequest(eventId, registrarId, reason) {
    try {
      const response = await api.post(`${API_ENDPOINTS.REGISTRARS.REJECT_VOLUNTEER_REQUEST}/${eventId}/reject/${registrarId}`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting volunteer request:', error);
      throw error;
    }
  }
};

export default registrarVolunteerService;
