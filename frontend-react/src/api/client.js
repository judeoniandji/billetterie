const API_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data, status: res.status }
}

export const api = {
  getEvents: () => request('/evenements?limit=100'),
  getReservations: (userId) => request(`/reservations/utilisateur/${userId}`),
  createReservation: (body) => request('/reservations', { method: 'POST', body: JSON.stringify(body) }),
  payReservation: (id) => request(`/reservations/${id}/payer`, { method: 'POST' }),
  getBillets: (id) => request(`/reservations/${id}/billets`),
  auth: (body) => request('/utilisateurs', { method: 'POST', body: JSON.stringify(body) }),
}
