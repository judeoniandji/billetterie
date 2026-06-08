import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { formatPrice, getRemainingSeconds } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import AuthModal from '../components/AuthModal'
import SkeletonGrid from '../components/SkeletonGrid'

export default function Reservations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    api.getReservations(user._id).then(({ ok, data }) => {
      if (ok) setReservations(data)
      setLoading(false)
    })
  }, [user])

  if (!user) {
    return (
      <>
        <div className="container empty-state page-enter">
          <div className="empty-state__icon">🎫</div>
          <h3>Connectez-vous pour voir vos billets</h3>
          <button type="button" className="btn btn--primary" onClick={() => setAuthOpen(true)}>
            Se connecter
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    )
  }

  if (loading) return <div className="container"><SkeletonGrid count={3} /></div>

  if (!reservations.length) {
    return (
      <div className="container empty-state page-enter">
        <div className="empty-state__icon">🎫</div>
        <h3>Aucune réservation</h3>
        <p>Explorez nos événements et réservez vos places.</p>
        <Link to="/events" className="btn btn--primary" style={{ marginTop: 16 }}>Voir les événements</Link>
      </div>
    )
  }

  return (
    <section className="section page-enter">
      <div className="container">
        <h2 className="section__title">Mes billets</h2>
        <p className="section__subtitle" style={{ marginBottom: 32 }}>
          Gérez vos réservations et accédez à vos billets
        </p>
        <div className="reservations-list">
          {reservations.map((res) => {
            const event = res.evenement_id
            const title = event?.titre || `Réservation #${res._id.substring(0, 8)}`
            const remaining = res.statut === 'EN_ATTENTE' ? getRemainingSeconds(res) : 0
            const eventId = typeof event === 'object' ? event._id : res.evenement_id

            return (
              <div key={res._id} className="reservation-card">
                <div className="reservation-card__info">
                  <h3>{title}</h3>
                  <p>
                    {res.nombre_places} place{res.nombre_places > 1 ? 's' : ''} • {formatPrice(res.montant_total)}
                    {res.statut === 'EN_ATTENTE' && remaining > 0 &&
                      ` • Expire dans ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
                  </p>
                </div>
                <div className="reservation-card__actions">
                  <StatusBadge statut={res.statut} />
                  {res.statut === 'EN_ATTENTE' && remaining > 0 && (
                    <button
                      type="button"
                      className="btn btn--success btn--sm"
                      onClick={() => navigate(`/booking/${eventId}/${res._id}`)}
                    >
                      Payer
                    </button>
                  )}
                  {res.statut === 'CONFIRMEE' && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => navigate(`/ticket/${res._id}`)}
                    >
                      Voir le billet
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
