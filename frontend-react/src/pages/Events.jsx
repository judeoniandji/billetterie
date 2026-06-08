import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useEvents } from '../hooks/useEvents'
import { useToast } from '../context/ToastContext'
import CategoryPills from '../components/CategoryPills'
import EventsGrid from '../components/EventsGrid'

export default function Events() {
  const location = useLocation()
  const { loading, filterEvents, getLieux } = useEvents()
  const { show } = useToast()

  const [filters, setFilters] = useState({
    search: location.state?.search || '',
    lieu: '',
    prixMax: '',
    category: location.state?.category || '',
    sort: 'popularite',
  })

  useEffect(() => {
    if (location.state) {
      setFilters((f) => ({
        ...f,
        search: location.state.search ?? f.search,
        category: location.state.category ?? f.category,
      }))
    }
  }, [location.state])

  const filtered = filterEvents(filters)
  const lieux = getLieux()

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  function resetFilters() {
    setFilters({ search: '', lieu: '', prixMax: '', category: '', sort: 'popularite' })
    show('Filtres réinitialisés', 'info')
  }

  return (
    <section className="section page-enter">
      <div className="container">
        <div className="section__header">
          <div>
            <h2 className="section__title">Tous les événements</h2>
            <p className="section__subtitle">
              {filtered.length} événement{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <CategoryPills active={filters.category} onChange={(c) => updateFilter('category', c)} />

        <div className="filters-layout">
          <aside className="filters-panel">
            <h3>Filtres</h3>
            <div className="form-field">
              <label>Recherche</label>
              <input type="text" placeholder="Événement, ville..." value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Lieu</label>
              <select value={filters.lieu} onChange={(e) => updateFilter('lieu', e.target.value)}>
                <option value="">Tous les lieux</option>
                {lieux.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Prix max</label>
              <select value={filters.prixMax} onChange={(e) => updateFilter('prixMax', e.target.value)}>
                <option value="">Tous les prix</option>
                <option value="5000">Moins de 5 000 FCFA</option>
                <option value="10000">Moins de 10 000 FCFA</option>
                <option value="20000">Moins de 20 000 FCFA</option>
              </select>
            </div>
            <div className="form-field">
              <label>Tri</label>
              <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
                <option value="popularite">Popularité</option>
                <option value="prix">Prix croissant</option>
              </select>
            </div>
            <button type="button" className="btn btn--secondary btn--full" onClick={resetFilters}>Réinitialiser</button>
          </aside>

          <div>
            <div className="section__header">
              <div>
                <h2 className="section__title">Tous les événements</h2>
                <p className="section__subtitle">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <EventsGrid events={filtered} loading={loading} />
          </div>
        </div>
      </div>
    </section>
  )
}
