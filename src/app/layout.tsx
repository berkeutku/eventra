import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
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
    <html lang="tr" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}