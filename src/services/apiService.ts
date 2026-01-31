import { getIdToken } from '@/config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to make authenticated requests
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getIdToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============ User API ============

export async function registerUser(username: string, displayName?: string) {
  return fetchWithAuth('/users/register', {
    method: 'POST',
    body: JSON.stringify({ username, displayName }),
  });
}

export async function getCurrentUser() {
  return fetchWithAuth('/users/me');
}

export async function updateUser(updates: { displayName?: string; avatarUrl?: string }) {
  return fetchWithAuth('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function searchUsers(query: string) {
  return fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}`);
}

export async function addPoints(points: number, reason: string) {
  return fetchWithAuth('/users/add-points', {
    method: 'POST',
    body: JSON.stringify({ points, reason }),
  });
}

export async function addScan(productName: string, brand: string, category: string, ecoScore: number) {
  return fetchWithAuth('/users/add-scan', {
    method: 'POST',
    body: JSON.stringify({ productName, brand, category, ecoScore }),
  });
}

export async function addBadge(badge: {
  badgeId: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
}) {
  return fetchWithAuth('/users/add-badge', {
    method: 'POST',
    body: JSON.stringify(badge),
  });
}

// ============ Friends API ============

export async function getFriends() {
  return fetchWithAuth('/friends');
}

export async function getFriendRequests() {
  return fetchWithAuth('/friends/requests');
}

export async function sendFriendRequest(userId?: string, friendCode?: string) {
  return fetchWithAuth('/friends/request', {
    method: 'POST',
    body: JSON.stringify({ userId, friendCode }),
  });
}

export async function acceptFriendRequest(userId: string) {
  return fetchWithAuth(`/friends/accept/${userId}`, {
    method: 'POST',
  });
}

export async function rejectFriendRequest(userId: string) {
  return fetchWithAuth(`/friends/reject/${userId}`, {
    method: 'POST',
  });
}

export async function removeFriend(userId: string) {
  return fetchWithAuth(`/friends/${userId}`, {
    method: 'DELETE',
  });
}

export async function lookupFriendCode(code: string) {
  return fetchWithAuth(`/friends/code/${encodeURIComponent(code)}`);
}

// ============ Leaderboard API ============

export async function getLeaderboard(timeframe: 'weekly' | 'alltime' = 'alltime', limit = 50) {
  return fetchWithAuth(`/leaderboard?timeframe=${timeframe}&limit=${limit}`);
}

export async function getFriendsLeaderboard(timeframe: 'weekly' | 'alltime' = 'alltime') {
  return fetchWithAuth(`/leaderboard/friends?timeframe=${timeframe}`);
}

export async function getMyRank() {
  return fetchWithAuth('/leaderboard/my-rank');
}

export async function getLeaderboardStats() {
  // This endpoint doesn't require auth
  const response = await fetch(`${API_BASE_URL}/leaderboard/stats`);
  if (!response.ok) {
    throw new Error('Failed to get stats');
  }
  return response.json();
}

// ============ Health Check ============

export async function checkApiHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
