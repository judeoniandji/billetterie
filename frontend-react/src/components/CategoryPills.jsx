const CATEGORIES = [
  { id: '', label: 'Tous', icon: '✨' },
  { id: 'concert', label: 'Concerts', icon: '🎵' },
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'conference', label: 'Conférences', icon: '🎤' },
]

export default function CategoryPills({ active, onChange }) {
  return (
    <div className="categories">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`category-pill${active === c.id ? ' active' : ''}`}
          onClick={() => onChange(c.id)}
        >
          {c.icon} {c.label}
        </button>
      ))}
    </div>
  )
}
