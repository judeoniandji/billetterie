export default function SkeletonGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--btn" />
        </div>
      ))}
    </div>
  )
}
