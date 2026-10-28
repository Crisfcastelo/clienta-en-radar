import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-(--radius-tarjeta) border border-borde bg-superficie shadow-(--shadow-suave) ${className}`}
      {...props}
    />
  );
}
