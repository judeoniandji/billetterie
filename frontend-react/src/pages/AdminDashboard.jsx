export default function AdminDashboard() {
  const metrics = [
    { label: 'Événements actifs', value: '128' },
    { label: 'Réservations aujourd’hui', value: '2 418' },
    { label: 'Taux de conversion', value: '18,4%' },
    { label: 'Places restantes', value: '6 902' },
  ]

  const rows = [
    ['Afro Live Night', 'Concert', '1 240', '72%'],
    ['Tech Summit 2026', 'Conférence', '840', '61%'],
    ['Ligue Élite', 'Sport', '1 980', '89%'],
  ]

  return (
    <section className="section page-enter">
      <div className="container">
        <div className="section__header">
          <div>
            <h1 className="section__title">Dashboard admin</h1>
            <p className="section__subtitle">Gestion des événements, suivi des ventes et disponibilité temps réel.</p>
          </div>
          <button type="button" className="btn btn--primary">Créer un événement</button>
        </div>

        <div className="admin-hero">
          <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {metrics.map((m) => (
              <div key={m.label} className="admin-metric">
                <div className="admin-metric__value">{m.value}</div>
                <div className="admin-metric__label">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <h2 style={{ marginTop: 0 }}>Activité en temps réel</h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>Les jauges se mettent à jour avec les dernières réservations.</p>
            <div className="availability-bar">
              <div className="availability-bar__header"><span>Places vendues aujourd’hui</span><strong>72%</strong></div>
              <div className="availability-bar__track"><div className="availability-bar__fill" style={{ width: '72%' }} /></div>
            </div>
            <div className="availability-bar">
              <div className="availability-bar__header"><span>Événements presque complets</span><strong>14</strong></div>
              <div className="availability-bar__track"><div className="availability-bar__fill availability-bar__fill--low" style={{ width: '46%' }} /></div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }} className="admin-card">
          <h2 style={{ marginTop: 0 }}>Événements suivis</h2>
          <div className="admin-table">
            {rows.map((row) => (
              <div key={row[0]} className="admin-row">
                <strong>{row[0]}</strong>
                <span>{row[1]}</span>
                <span>{row[2]} billets</span>
                <span>{row[3]} rempli</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
