"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type Listener = () => void;

let current: { id: number; message: string } | null = null;
const listeners = new Set<Listener>();

/** Muestra un aviso breve. La región está siempre montada para que los lectores de pantalla lo anuncien. */
export function toast(message: string) {
  current = { id: Date.now(), message };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function Toaster() {
  const item = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  const [hiddenId, setHiddenId] = useState<number | null>(null);

  useEffect(() => {
    if (!item) return;
    const timer = setTimeout(() => setHiddenId(item.id), 5000);
    return () => clearTimeout(timer);
  }, [item]);

  const visible = item && item.id !== hiddenId;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-8"
    >
      {visible ? (
        <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-chocolate px-5 py-3.5 font-semibold text-white shadow-lg">
          <CircleCheck aria-hidden className="size-5 shrink-0 text-oliva-claro" />
          <span>{item.message}</span>
        </div>
      ) : null}
    </div>
  );
}
