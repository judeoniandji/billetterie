import { useState, useEffect } from 'react'
import { getRemainingSeconds, formatCountdown } from '../utils/helpers'

export default function Countdown({ reservation, onExpire }) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(reservation))

  useEffect(() => {
    const tick = () => {
      const r = getRemainingSeconds(reservation)
      setRemaining(r)
      if (r <= 0) onExpire?.()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [reservation, onExpire])

  const urgent = remaining > 0 && remaining < 120
  const expired = remaining <= 0

  return (
    <div className={`countdown${urgent ? ' countdown--urgent' : ''}${expired ? ' countdown--expired' : ''}`}>
      <span className="countdown__icon">⏱</span>
      <div>
        <div className="countdown__time">{formatCountdown(remaining)}</div>
        <div className="countdown__label">
          {expired ? 'Réservation expirée' : 'Temps restant pour payer'}
        </div>
      </div>
    </div>
  )
}
