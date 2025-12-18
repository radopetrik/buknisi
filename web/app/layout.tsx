import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import "react-day-picker/dist/style.css";
import { BookingProvider } from "./components/BookingContext";
import BookingSheet from "./components/BookingSheet";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bukni Si - Rezervujte krásu a wellness",
  description: "Objavujte a rezervujte krásu & wellness pri vás doma či v meste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className={`${playfair.variable} ${manrope.variable}`}>
        <BookingProvider>
            {children}
            <Footer />
            <BookingSheet />
            <AuthModal />
        </BookingProvider>
      </body>
    </html>
  );
}
