import { apiClient } from './axios';

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/');
    // Handle both paginated { results: [] } and plain array responses
    return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
  },
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/notifications/mark_all_read/');
    return response.data;
  }
};
