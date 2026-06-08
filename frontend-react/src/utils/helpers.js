export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'

export const TTL_SECONDS = 600

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatPrice(price) {
  return `${price.toLocaleString('fr-FR')} FCFA`
}

export function getCategory(event) {
  const text = `${event.titre} ${event.description || ''} ${event.lieu}`.toLowerCase()
  if (/concert|live|showcase|festival|soirée|musique|dj|ndjoka/.test(text)) return 'concert'
  if (/sport|stade|match|football|basket/.test(text)) return 'sport'
  if (/conférence|conference|forum|séminaire|institut/.test(text)) return 'conference'
  return 'autre'
}

export const CATEGORY_LABELS = {
  concert: 'Concert',
  sport: 'Sport',
  conference: 'Conférence',
  autre: 'Événement',
}

export function isEventPassed(event) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(event.date)
  d.setHours(0, 0, 0, 0)
  return d < today
}

export function getAvailabilityPercent(event) {
  return Math.round((event.places_disponibles / event.capacite_totale) * 100)
}

export function getRemainingSeconds(reservation) {
  const elapsed = Math.floor((Date.now() - new Date(reservation.date_creation)) / 1000)
  return Math.max(0, TTL_SECONDS - elapsed)
}

export function formatCountdown(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
