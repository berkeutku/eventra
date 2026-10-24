import type { Metadata } from "next";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Eventra | Your Event. Your Route.",
  description:
    "Etkinlik sonrası ulaşım sorununa çözüm: aynı etkinliğe katılan kişilerle ortak yolculuk planla.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${jakarta.variable} ${caveat.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <div className="flex-1 pb-24 sm:pb-0">{children}</div>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}