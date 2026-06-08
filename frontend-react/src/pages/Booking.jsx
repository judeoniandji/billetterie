import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useEvents } from '../hooks/useEvents'
import { api } from '../api/client'
import { formatDate, formatPrice, getRemainingSeconds } from '../utils/helpers'
import Countdown from '../components/Countdown'
import StatusBadge from '../components/StatusBadge'
import AuthModal from '../components/AuthModal'

export default function Booking() {
  const { eventId, reservationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { show } = useToast()
  const { getById, fetchEvents } = useEvents()

  const [authOpen, setAuthOpen] = useState(false)
  const [reservation, setReservation] = useState(null)
  const [places, setPlaces] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [expired, setExpired] = useState(false)

  const event = getById(eventId)
  const hasReservation = reservation?.statut === 'EN_ATTENTE'
  const total = hasReservation ? reservation.montant_total : (event?.prix || 0) * places

  useEffect(() => {
    if (!user) setAuthOpen(true)
  }, [user])

  useEffect(() => {
    if (!reservationId || !user) return
    api.getReservations(user._id).then(({ ok, data }) => {
      if (ok) {
        const res = data.find((r) => r._id === reservationId)
        if (res) {
          setReservation(res)
          setPlaces(res.nombre_places)
          setExpired(getRemainingSeconds(res) <= 0)
        }
      }
    })
  }, [reservationId, user])

  if (!event) {
    return (
      <div className="container empty-state">
        <h3>Événement introuvable</h3>
        <Link to="/events" className="btn btn--primary">Retour</Link>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) { setAuthOpen(true); return }

    setSubmitting(true)
    const { ok, data } = await api.createReservation({
      utilisateur_id: user._id,
      evenement_id: eventId,
      nombre_places: places,
    })
    setSubmitting(false)

    if (ok) {
      setReservation(data.reservation)
      show('Réservation réussie ! Vous avez 10 minutes pour payer.', 'success')
      navigate(`/booking/${eventId}/${data.reservation._id}`, { replace: true })
      fetchEvents()
    } else {
      show(data.message || 'Erreur de réservation', 'error')
    }
  }

  async function handlePay() {
    if (!reservation) return
    setPaying(true)
    const { ok, data } = await api.payReservation(reservation._id)
    setPaying(false)

    if (ok) {
      show('Réservation réussie ! Vos billets sont prêts.', 'success')
      navigate(`/ticket/${reservation._id}`)
      fetchEvents()
    } else {
      show(data.message || 'Erreur de paiement', 'error')
    }
  }

  return (
    <>
      <div className="booking-page page-enter">
        <div className="container">
          <nav className="breadcrumb">
            <Link to={`/event/${eventId}`}>← Retour à l'événement</Link>
          </nav>

          <div className="booking-page__grid">
            <div className="booking-form-card">
              <h2>{hasReservation ? 'Finaliser votre réservation' : 'Réserver vos places'}</h2>
              {hasReservation && (
                <Countdown reservation={reservation} onExpire={() => setExpired(true)} />
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-field">
                    <label>Prénom</label>
                    <input value={user?.prenom || ''} readOnly={hasReservation} required />
                  </div>
                  <div className="form-field">
                    <label>Nom</label>
                    <input value={user?.nom || ''} readOnly={hasReservation} required />
                  </div>
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" defaultValue={user?.email || ''} placeholder="votre@email.com" readOnly={hasReservation} />
                </div>
                <div className="form-field">
                  <label>Nombre de places</label>
                  <input
                    type="number"
                    min="1"
                    max={event.places_disponibles + (hasReservation ? reservation.nombre_places : 0)}
                    value={places}
                    readOnly={hasReservation}
                    onChange={(e) => setPlaces(parseInt(e.target.value) || 1)}
                  />
                </div>
                {!hasReservation && (
                  <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={submitting || !user}>
                    {submitting ? 'Réservation en cours...' : 'Confirmer la réservation'}
                  </button>
                )}
              </form>
            </div>

            <div className="order-summary-card">
              <h2>Résumé de commande</h2>
              <div className="order-line"><span>Événement</span><span>{event.titre}</span></div>
              <div className="order-line"><span>Date</span><span>{formatDate(event.date)}</span></div>
              <div className="order-line"><span>Lieu</span><span>{event.lieu}</span></div>
              <div className="order-line"><span>Prix unitaire</span><span>{formatPrice(event.prix)}</span></div>
              <div className="order-line"><span>Places</span><span>{places}</span></div>
              <div className="order-line order-line--total"><span>Total</span><span>{formatPrice(total)}</span></div>

              {hasReservation && (
                <>
                  <div style={{ marginTop: 20 }}><StatusBadge statut="EN_ATTENTE" /></div>
                  <button
                    type="button"
                    className="btn btn--success btn--full btn--lg"
                    style={{ marginTop: 20 }}
                    disabled={paying || expired}
                    onClick={handlePay}
                  >
                    {paying ? 'Paiement en cours...' : 'Confirmer le paiement'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <AuthModal open={authOpen && !user} onClose={() => { setAuthOpen(false); navigate(-1) }} />
    </>
  )
}
