import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthModal from './AuthModal'

export default function Header() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)
  const logoTo = user?.role === 'admin' ? '/admin' : '/'

  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <NavLink to={logoTo} className="logo" onClick={closeMenu}>
            <span className="logo__icon">🎟</span>
            <span className="logo__text">EventPass</span>
          </NavLink>

          <nav className={`nav ${menuOpen ? 'nav--open' : ''}`}>
            <NavLink to="/" end className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Accueil
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Événements
            </NavLink>
            <NavLink to="/reservations" className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Mes billets
            </NavLink>
          </nav>

          <div className="header__actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={toggleTheme} aria-label="Basculer le thème">
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            {user ? (
              <div className="user-profile">
                <div className="user-profile__avatar">{user.prenom[0].toUpperCase()}</div>
                <div className="user-profile__info">
                  <span className="user-profile__name">{user.prenom} {user.nom}</span>
                  <button type="button" className="user-profile__logout" onClick={logout}>Déconnexion</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setAuthOpen(true)}>
                Connexion
              </button>
            )}
            <button type="button" className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}

export function useAuthModal() {
  const [open, setOpen] = useState(false)
  return { open, openModal: () => setOpen(true), closeModal: () => setOpen(false) }
}
