import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-(--radius-tarjeta) border border-white/80 bg-superficie/90 shadow-(--shadow-suave) ${className}`}
      {...props}
    />
  );
}
