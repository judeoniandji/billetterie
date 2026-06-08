import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '../hooks/useEvents'
import CategoryPills from '../components/CategoryPills'
import EventsGrid from '../components/EventsGrid'
import heroImage from '../assets/hero.png'

export default function Home() {
  const navigate = useNavigate()
  const { loading, getPopular, getLieux, events } = useEvents()
  const [search, setSearch] = useState('')

  function handleSearch() {
    navigate('/events', { state: { search } })
  }

  function handleCategory(cat) {
    navigate('/events', { state: { category: cat } })
  }

  return (
    <>
      <section className="hero">
        <div className="container hero__shell">
          <div className="hero__inner">
            <div>
              <div className="hero__kicker">EventPass</div>
              <h1 className="hero__title">Réservez vos événements en <span>quelques clics</span></h1>
              <p className="hero__subtitle">
                Une expérience de billetterie fluide pour concerts, spectacles, conférences et sports, avec paiement rapide et billet numérique instantané.
              </p>
              <div className="hero__search">
                <input
                  type="text"
                  placeholder="Événement"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <input type="text" placeholder="Ville" />
                <input type="date" />
                <button type="button" className="btn btn--primary" onClick={handleSearch}>Rechercher</button>
              </div>
              <div className="hero__stats">
                <div className="hero__stat"><div className="hero__stat-value">{events.length}</div><div className="hero__stat-label">Événements</div></div>
                <div className="hero__stat"><div className="hero__stat-value">{getLieux().length}</div><div className="hero__stat-label">Villes</div></div>
                <div className="hero__stat"><div className="hero__stat-value">10 min</div><div className="hero__stat-label">Réservation</div></div>
              </div>
            </div>
              <div className="hero__visual">
              <img src={heroImage} alt="Aperçu EventPass" />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container page-enter">
          <CategoryPills active="" onChange={handleCategory} />
          <div className="section__header">
            <div>
              <h2 className="section__title">Événements populaires</h2>
              <p className="section__subtitle">Les plus demandés en ce moment</p>
            </div>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => navigate('/events')}>
              Voir tout →
            </button>
          </div>
          <EventsGrid events={getPopular()} loading={loading} />
        </div>
      </section>
    </>
  )
}
