import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Fraunces } from "next/font/google";
import "./globals.css";

// next/font descarga las fuentes al compilar y las sirve desde nuestro dominio:
// el navegador de la usuaria nunca contacta con Google.
const texto = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-texto",
  display: "swap",
  // Next no tiene métricas de esta fuente para ajustar la de reserva.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

const titulos = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-titulos",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: { default: "Clienta en Radar", template: "%s · Clienta en Radar" },
  description: "Controla a quién tienes que responder y qué conversaciones necesitan seguimiento.",
  applicationName: "Clienta en Radar",
  robots: { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f1e7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-ES" className={`${texto.variable} ${titulos.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
