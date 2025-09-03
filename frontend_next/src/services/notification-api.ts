
"use client";

import type { Notification, ApiError } from '@/types';
import { getToken } from '@/lib/auth-utils';

const API_BASE_URL = 'http://localhost:8000';

async function fetchNotificationApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const newHeaders = new Headers();

  if (options.headers) {
    const currentHeaders = new Headers(options.headers);
    currentHeaders.forEach((value, key) => {
      newHeaders.append(key, value);
    });
  }

  if (!newHeaders.has('Content-Type')) {
    newHeaders.set('Content-Type', 'application/json');
  }
  
  if (token) {
    newHeaders.set('Authorization', `Bearer ${token}`);
  }

  const finalOptions: RequestInit = {
    ...options,
    headers: newHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({ detail: 'Request failed with status ' + response.status }));
    console.error(`API Error (${response.status}) for ${endpoint}:`, errorData.detail);
    const message = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    throw new Error(message);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }
  return response.json();
}

export const getMyNotifications = async (skip: number = 0, limit: number = 20): Promise<Notification[]> => {
  return fetchNotificationApi(`/notifications/?skip=${skip}&limit=${limit}`);
};

export const markNotificationAsRead = async (notificationId: number): Promise<{ message: string } | null> => {
  return fetchNotificationApi(`/notifications/${notificationId}/read`, { method: 'POST' });
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string } | null> => {
  return fetchNotificationApi('/notifications/read-all', { method: 'POST' });
};

export const getUnreadNotificationCount = async (): Promise<{ count: number }> => {
  return fetchNotificationApi('/notifications/unread-count');
};
