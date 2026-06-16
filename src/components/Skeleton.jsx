export function Skeleton({ className = '', width, height = 'h-4' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${height} ${className}`}
      style={width ? { width } : undefined}
    />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === 0 ? '75%' : i === lines - 1 ? '50%' : '100%'}
          height={i === 0 ? 'h-4' : 'h-3'}
        />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
