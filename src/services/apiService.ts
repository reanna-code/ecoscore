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

// ============ NGOs API ============

export async function getNgos() {
  const response = await fetch(`${API_BASE_URL}/ngos`);
  if (!response.ok) throw new Error('Failed to fetch NGOs');
  return response.json();
}

export async function getNgo(id: string) {
  const response = await fetch(`${API_BASE_URL}/ngos/${id}`);
  if (!response.ok) throw new Error('Failed to fetch NGO');
  return response.json();
}

// ============ Sponsors API ============

export async function getSponsors() {
  const response = await fetch(`${API_BASE_URL}/sponsors`);
  if (!response.ok) throw new Error('Failed to fetch sponsors');
  return response.json();
}

export async function getSponsor(id: string) {
  const response = await fetch(`${API_BASE_URL}/sponsors/${id}`);
  if (!response.ok) throw new Error('Failed to fetch sponsor');
  return response.json();
}

// ============ Products API ============

export async function getProducts(params?: { category?: string; search?: string; partnerOnly?: boolean }) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.partnerOnly) query.set('partnerOnly', 'true');

  const response = await fetch(`${API_BASE_URL}/products?${query}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function getProduct(id: string) {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
}

export async function getProductAlternatives(id: string) {
  const response = await fetch(`${API_BASE_URL}/products/${id}/alternatives`);
  if (!response.ok) throw new Error('Failed to fetch alternatives');
  return response.json();
}

// ============ Pledges API ============

export async function createPledge(ngoId: string, points: number) {
  return fetchWithAuth('/pledges', {
    method: 'POST',
    body: JSON.stringify({ ngoId, points }),
  });
}

export async function getPledges(status?: string) {
  const query = status ? `?status=${status}` : '';
  return fetchWithAuth(`/pledges${query}`);
}

export async function getPledgeStats() {
  const response = await fetch(`${API_BASE_URL}/pledges/stats`);
  if (!response.ok) throw new Error('Failed to fetch pledge stats');
  return response.json();
}

export async function getWeeklyPledgesByNgo() {
  const response = await fetch(`${API_BASE_URL}/pledges/stats`);
  if (!response.ok) throw new Error('Failed to fetch weekly pledges');
  return response.json();
}

// ============ Donations API ============

export async function getDonations(limit = 20) {
  const response = await fetch(`${API_BASE_URL}/donations?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch donations');
  return response.json();
}

export async function getDonationStats() {
  const response = await fetch(`${API_BASE_URL}/donations/stats`);
  if (!response.ok) throw new Error('Failed to fetch donation stats');
  return response.json();
}

export async function getDonationByTx(txSignature: string) {
  const response = await fetch(`${API_BASE_URL}/donations/tx/${txSignature}`);
  if (!response.ok) throw new Error('Failed to fetch donation');
  return response.json();
}

export async function getBatchReceipts(limit = 10) {
  const response = await fetch(`${API_BASE_URL}/donations?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch batch receipts');
  return response.json();
}

// ============ Certificates API ============

export async function getMilestones() {
  return fetchWithAuth('/certificates/milestones');
}

export async function mintCertificateNft(milestone: number, ngoName?: string, txSignature?: string) {
  return fetchWithAuth('/certificates/mint', {
    method: 'POST',
    body: JSON.stringify({ milestone, ngoName, txSignature }),
  });
}

export async function getCertificates() {
  return fetchWithAuth('/certificates');
}

export async function getWallet() {
  return fetchWithAuth('/certificates/wallet');
}

export async function devClearCertificates() {
  return fetchWithAuth('/certificates/dev-clear', { method: 'DELETE' });
}

// ============ Points API ============

export async function getPointsBalance() {
  return fetchWithAuth('/points/balance');
}

export async function captureProduct(productId: string, actionType?: string, selectedAlternativeId?: string) {
  return fetchWithAuth('/points/capture', {
    method: 'POST',
    body: JSON.stringify({ productId, actionType, selectedAlternativeId }),
  });
}

export async function selectAlternative(originalProductId: string, alternativeProductId: string) {
  return fetchWithAuth('/points/select-alternative', {
    method: 'POST',
    body: JSON.stringify({ originalProductId, alternativeProductId }),
  });
}

export async function devGrantPoints(amount: number = 1000) {
  return fetchWithAuth('/points/dev-grant', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function devProcessBatch() {
  const response = await fetch(`${API_BASE_URL}/admin/batch/process-solana`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Batch failed' }));
    throw new Error(error.error || 'Batch processing failed');
  }
  return response.json();
}

export async function devFillVault(amount: number = 0.5) {
  const response = await fetch(`${API_BASE_URL}/admin/vault/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Deposit failed' }));
    throw new Error(error.error || 'Vault deposit failed');
  }
  return response.json();
}

// ============ Health Check ============

export async function checkApiHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
