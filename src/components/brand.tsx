/** Logotipo: un radar sencillo en SVG, sin dependencias. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <circle cx="16" cy="16" r="15" fill="#55602f" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#f7f1e7" strokeWidth="1.5" opacity="0.55" />
      <circle cx="16" cy="16" r="5" fill="none" stroke="#f7f1e7" strokeWidth="1.5" opacity="0.8" />
      <path d="M16 16 L16 3 A13 13 0 0 1 27.3 9.5 Z" fill="#c29b4e" opacity="0.85" />
      <circle cx="21.5" cy="10.5" r="2" fill="#f7f1e7" />
    </svg>
  );
}

export function BrandName() {
  return (
    <span className="flex items-center gap-2">
      <BrandMark />
      <span className="font-display text-lg font-semibold leading-none">
        Clienta en Radar
        <span className="block font-sans text-xs font-normal tracking-wide text-chocolate-suave">por Crisfcastelo</span>
      </span>
    </span>
  );
}
