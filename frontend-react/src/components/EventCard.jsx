import { useNavigate } from 'react-router-dom'
import {
  FALLBACK_IMAGE,
  formatDate,
  formatPrice,
  getCategory,
  CATEGORY_LABELS,
  isEventPassed,
} from '../utils/helpers'

export default function EventCard({ event }) {
  const navigate = useNavigate()
  const cat = getCategory(event)
  const passed = isEventPassed(event)
  const isLow = event.places_disponibles < 10 && event.places_disponibles > 0
  const isFull = event.places_disponibles === 0

  return (
    <article
      className={`event-card${passed ? ' event-card--passed' : ''}`}
      onClick={() => navigate(`/event/${event._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/event/${event._id}`)}
    >
      <div className="event-card__image-wrap">
        <img
          className="event-card__image"
          src={event.image || FALLBACK_IMAGE}
          alt={event.titre}
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK_IMAGE }}
        />
        <span className={`event-card__badge event-card__badge--${cat}`}>
          {CATEGORY_LABELS[cat]}
        </span>
        <span className={`event-card__availability${isLow ? ' event-card__availability--low' : ''}`}>
          {isFull ? 'Complet' : `${event.places_disponibles} places`}
        </span>
      </div>
      <div className="event-card__body">
        <div className="event-card__date">{formatDate(event.date)}</div>
        <h3 className="event-card__title">{event.titre}</h3>
        <div className="event-card__location">📍 {event.lieu}</div>
        <div className="event-card__footer">
          <div className="event-card__price">
            {formatPrice(event.prix)} <small>/ place</small>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={isFull || passed}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/booking/${event._id}`)
            }}
          >
            {passed ? 'Passé' : isFull ? 'Complet' : 'Réserver'}
          </button>
        </div>
      </div>
    </article>
  )
}
