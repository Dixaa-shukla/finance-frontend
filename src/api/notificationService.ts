import { axiosClient } from '@/api/axiosClient';
import type { NotificationResponse } from '@/types/notification';

export const notificationService = {
  async getAll(userId: number): Promise<NotificationResponse[]> { const { data } = await axiosClient.get<NotificationResponse[]>(`/notifications/user/${userId}`); return data; },
  async getUnread(userId: number): Promise<NotificationResponse[]> { const { data } = await axiosClient.get<NotificationResponse[]>(`/notifications/user/${userId}/unread`); return data; },
  async getUnreadCount(userId: number): Promise<number> { const { data } = await axiosClient.get<{ unreadCount: number }>(`/notifications/user/${userId}/unread-count`); return data.unreadCount; },
  async markRead(id: number): Promise<NotificationResponse> { const { data } = await axiosClient.patch<NotificationResponse>(`/notifications/${id}/read`); return data; },
  async markAllRead(userId: number): Promise<void> { await axiosClient.patch(`/notifications/user/${userId}/read-all`); },
  async remove(id: number): Promise<void> { await axiosClient.delete(`/notifications/${id}`); },
};
