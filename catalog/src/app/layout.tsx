import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Bukni Si",
    default: "Bukni Si — Katalóg krásy a wellness",
  },
  description:
    "Objavte salóny krásy a wellness v okolí, porovnajte služby a rezervujte sa online.",
  metadataBase: new URL("https://buknisi.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body
        className={`${playfair.variable} ${lato.variable} font-body min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
