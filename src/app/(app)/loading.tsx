export default function Loading() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-4 pt-2">
      <div className="h-9 w-2/3 animate-pulse rounded-full bg-neutro" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 animate-pulse rounded-(--radius-tarjeta) bg-neutro" />
        <div className="h-24 animate-pulse rounded-(--radius-tarjeta) bg-neutro" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-(--radius-tarjeta) bg-neutro" />
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
