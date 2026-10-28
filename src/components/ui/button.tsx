import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-oliva text-white hover:bg-oliva-oscuro",
  secondary: "border border-borde-campo bg-superficie text-chocolate hover:bg-neutro",
  ghost: "text-chocolate hover:bg-neutro",
  danger: "bg-terracota text-white hover:bg-[#87301f]",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
}: { variant?: Variant; size?: Size; full?: boolean; className?: string } = {}) {
  return [base, variants[variant], sizes[size], full ? "w-full" : "", className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean };

export function Button({ variant, size, full, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, full, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean };

export function ButtonLink({ variant, size, full, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, full, className })} {...props} />;
}
