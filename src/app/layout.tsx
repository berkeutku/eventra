import type { Metadata, Viewport } from "next";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
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
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Eventra",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c4dff",
};

async function loadUser(): Promise<AuthUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error("Oturum okunamadı:", error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await loadUser();

  return (
    <html lang="tr" className={`${jakarta.variable} ${caveat.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <AuthProvider user={user}>
          <Header />
          <div className="flex-1 pb-24 sm:pb-0">{children}</div>
          <Footer />
          <BottomNav />
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}