export function ProfileSkeleton() {
  return (
    <div className="glass-card p-8 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-sky-200/70" />
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-sky-200/70" />
          <div className="h-3 w-28 rounded bg-sky-200/50" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-sky-200/50" />
            <div className="h-4 w-full rounded bg-sky-200/70" />
          </div>
        ))}
      </div>
    </div>
  );
}