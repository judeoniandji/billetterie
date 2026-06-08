import EventCard from './EventCard'
import SkeletonGrid from './SkeletonGrid'

export default function EventsGrid({ events, loading }) {
  if (loading) return <SkeletonGrid />

  if (!events.length) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🎭</div>
        <h3>Aucun événement trouvé</h3>
        <p>Essayez de modifier vos filtres de recherche.</p>
      </div>
    )
  }

  return (
    <div className="events-grid">
      {events.map((e) => <EventCard key={e._id} event={e} />)}
    </div>
  )
}
