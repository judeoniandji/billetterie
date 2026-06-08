import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="logo__text">EventPass</span>
          <p>La billetterie événementielle moderne, fluide et premium.</p>
        </div>
        <div className="footer__links">
          <Link to="/events">Événements</Link>
          <Link to="/reservations">Mes billets</Link>
          <Link to="/admin">Administration</Link>
        </div>
        <p className="footer__copy">&copy; 2026 EventPass. Tous droits réservés.</p>
      </div>
    </footer>
  )
}
