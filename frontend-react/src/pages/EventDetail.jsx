import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEvents } from '../hooks/useEvents'
import {
  FALLBACK_IMAGE,
  formatDate,
  formatPrice,
  getCategory,
  CATEGORY_LABELS,
  getAvailabilityPercent,
  isEventPassed,
} from '../utils/helpers'
import SkeletonGrid from '../components/SkeletonGrid'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, loading } = useEvents()
  const event = getById(id)

  if (loading && !event) return <div className="container"><SkeletonGrid count={1} /></div>
  if (!event) {
    return (
      <div className="container empty-state">
        <h3>Événement introuvable</h3>
        <Link to="/events" className="btn btn--primary">Retour</Link>
      </div>
    )
  }

  const cat = getCategory(event)
  const passed = isEventPassed(event)
  const isFull = event.places_disponibles === 0
  const pct = getAvailabilityPercent(event)
  const isLow = pct < 20

  return (
    <div className="event-detail page-enter">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">Accueil</Link> ›
          <Link to="/events">Événements</Link> ›
          <span>{event.titre}</span>
        </nav>

        <div className="event-detail__hero">
          <img
            src={event.image || FALLBACK_IMAGE}
            alt={event.titre}
            onError={(e) => { e.target.src = FALLBACK_IMAGE }}
          />
          <div className="event-detail__hero-overlay">
            <span className={`event-card__badge event-card__badge--${cat}`}>
              {CATEGORY_LABELS[cat]}
            </span>
            <h1 className="event-detail__hero-title">{event.titre}</h1>
            <div className="event-detail__hero-meta">
              <span>📅 {formatDate(event.date)}</span>
              <span>📍 {event.lieu}</span>
            </div>
          </div>
        </div>

        <div className="event-detail__grid">
          <div className="event-detail__description">
            <h2>À propos de cet événement</h2>
            <p>
              {event.description ||
                'Un événement exceptionnel vous attend. Réservez vos places dès maintenant pour ne rien manquer de cette expérience unique.'}
            </p>
          </div>

          <div className="booking-card">
            <div className="booking-card__price">{formatPrice(event.prix)}</div>
            <div className="booking-card__price-label">par place</div>
            <div className="availability-bar">
              <div className="availability-bar__header">
                <span>Places disponibles</span>
                <span><strong>{event.places_disponibles}</strong> / {event.capacite_totale}</span>
              </div>
              <div className="availability-bar__track">
                <div
                  className={`availability-bar__fill${isLow ? ' availability-bar__fill--low' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--full btn--lg"
              disabled={isFull || passed}
              onClick={() => navigate(`/booking/${event._id}`)}
            >
              {passed ? 'Événement passé' : isFull ? 'Complet' : 'Réserver maintenant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
