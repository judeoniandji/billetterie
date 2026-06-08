import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { formatDate } from '../utils/helpers'
import SkeletonGrid from '../components/SkeletonGrid'

function DigitalTicket({ billet, event, index, total, user }) {
  return (
    <div className="digital-ticket">
      <div className="digital-ticket__header">
        <h3>Eventia — Billet {index}/{total}</h3>
      </div>
      <div className="digital-ticket__body">
        <div className="digital-ticket__qr">
          <QRCodeSVG value={billet.code_barre} size={156} fgColor="#a5b4fc" bgColor="#1a1f2e" />
        </div>
        <div className="digital-ticket__code">{billet.code_barre}</div>
        <div className="digital-ticket__info">
          <div className="digital-ticket__row"><span>Événement</span><span>{event.titre}</span></div>
          <div className="digital-ticket__row"><span>Date</span><span>{formatDate(event.date)}</span></div>
          <div className="digital-ticket__row"><span>Lieu</span><span>{event.lieu}</span></div>
          <div className="digital-ticket__row">
            <span>Détenteur</span>
            <span>{user ? `${user.prenom} ${user.nom}` : '—'}</span>
          </div>
          <div className="digital-ticket__row"><span>Statut</span><span>{billet.statut}</span></div>
        </div>
      </div>
      <div className="digital-ticket__perforation"><div className="circle-right" /></div>
    </div>
  )
}

export default function Ticket() {
  const { id } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getBillets(id).then(({ ok, data: d }) => {
      if (ok) setData(d)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="container"><SkeletonGrid count={1} /></div>
  if (!data) {
    return (
      <div className="container empty-state">
        <h3>Billet introuvable</h3>
        <Link to="/reservations" className="btn btn--primary">Mes billets</Link>
      </div>
    )
  }

  const { billets } = data
  const event = data.reservation.evenement_id

  return (
    <div className="ticket-page page-enter">
      <div className="container">
        <div className="ticket-success">
          <div className="ticket-success__icon">✓</div>
          <h1>Réservation confirmée !</h1>
          <p>Vos billets digitaux sont prêts. Présentez le QR code à l'entrée.</p>
        </div>

        <div className="tickets-grid">
          {billets.map((b, i) => (
            <DigitalTicket
              key={b._id}
              billet={b}
              event={event}
              index={i + 1}
              total={billets.length}
              user={user}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/reservations" className="btn btn--secondary">Mes billets</Link>
          <Link to="/events" className="btn btn--primary" style={{ marginLeft: 12 }}>Plus d'événements</Link>
        </div>
      </div>
    </div>
  )
}
