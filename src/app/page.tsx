import { redirect } from "next/navigation";

// Fase 3: sin sesión irá a /acceso; con sesión y sin compra, a /sin-acceso.
export default function Home() {
  redirect("/hoy");
}
