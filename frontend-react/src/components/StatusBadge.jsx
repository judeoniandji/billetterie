const MAP = {
  EN_ATTENTE: ['status-badge--pending', 'En attente'],
  CONFIRMEE: ['status-badge--confirmed', 'Confirmée'],
  EXPIREE: ['status-badge--expired', 'Expirée'],
}

export default function StatusBadge({ statut }) {
  const [cls, label] = MAP[statut] || ['', statut]
  return <span className={`status-badge ${cls}`}>{label}</span>
}
