import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function AuthModal({ open, onClose }) {
  const { login, register } = useAuth()
  const { show } = useToast()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const telephone = e.target.telephone.value.trim()
    try {
      const data = await login(telephone)
      show(data.message, 'success')
      onClose()
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    const form = e.target
    try {
      const data = await register({
        prenom: form.prenom.value.trim(),
        nom: form.nom.value.trim(),
        telephone: form.telephone.value.trim(),
        ville: form.ville.value,
      })
      show(data.message, 'success')
      onClose()
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal active">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        <h2 className="modal__title">Bienvenue sur Eventia</h2>
        <p className="modal__subtitle">Connectez-vous pour réserver vos places</p>

        <div className="auth-tabs">
          <button type="button" className={`auth-tabs__btn${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>
            Connexion
          </button>
          <button type="button" className={`auth-tabs__btn${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>
            Inscription
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="loginTel">Téléphone</label>
              <input id="loginTel" name="telephone" type="tel" placeholder="+241 07 XX XX XX" required />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="regPrenom">Prénom</label>
                <input id="regPrenom" name="prenom" required />
              </div>
              <div className="form-field">
                <label htmlFor="regNom">Nom</label>
                <input id="regNom" name="nom" required />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="regTel">Téléphone</label>
              <input id="regTel" name="telephone" type="tel" required />
            </div>
            <div className="form-field">
              <label htmlFor="regVille">Ville</label>
              <select id="regVille" name="ville" defaultValue="Libreville">
                <option>Libreville</option>
                <option>Port-Gentil</option>
                <option>Franceville</option>
                <option>Owendo</option>
                <option>Akanda</option>
              </select>
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
