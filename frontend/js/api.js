/* ========================================
   API CLIENT - No ESM for Browser
   ======================================== */
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

// --- Helper ---
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erreur');
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// --- Events ---
async function getEvents() { return apiRequest('/evenements'); }
async function getEventById(id) { return apiRequest(`/evenements/${id}`); }

// --- Users ---
async function registerOrLoginUser(data) { return apiRequest('/utilisateurs', { method: 'POST', body: JSON.stringify(data) }); }

// --- Reservations ---
async function createReservation(data) { return apiRequest('/reservations', { method: 'POST', body: JSON.stringify(data) }); }
async function getReservationsByUser(userId) { return apiRequest(`/reservations/utilisateur/${userId}`); }
async function payReservation(id) { return apiRequest(`/reservations/${id}/payer`, { method: 'POST' }); }

window.api = { getEvents, getEventById, registerOrLoginUser, createReservation, getReservationsByUser, payReservation };
