import type { Metadata, Viewport } from "next";
import { unstable_rethrow } from "next/navigation";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ToastProvider from "@/components/Toast";
import UnreadProvider from "@/components/UnreadProvider";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { countUnread } from "@/lib/notifications";
import "./globals.css";

const SITE_URL = "https://eventra-one-azure.vercel.app";
const SITE_TITLE = "Eventra | Your Event. Your Route.";
const SITE_DESCRIPTION =
  "Aynı etkinliğe giden insanları etkinlik sonrası ortak yolculukta buluşturan bir demo projesi. Next.js, PostgreSQL ve PWA ile geliştirildi.";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Eventra",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Eventra",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#6c4dff",
};

async function loadUser(): Promise<AuthUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    unstable_rethrow(error);
    console.error("Oturum okunamadı:", error);
    return null;
  }
}

async function loadUnread(user: AuthUser | null): Promise<number> {
  if (!user) {
    return 0;
  }

  try {
    return await countUnread(user.id);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Bildirim sayısı okunamadı:", error);
    return 0;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await loadUser();
  const unread = await loadUnread(user);

  return (
    <html lang="tr" data-scroll-behavior="smooth" className={`${jakarta.variable} ${caveat.variable}`}>
      <body className="flex min-h-screen flex-col pb-[calc(4.75rem_+_env(safe-area-inset-bottom))] antialiased sm:pb-0">
        <AuthProvider user={user}>
          <UnreadProvider initial={unread}>
            <ToastProvider>
              <Header />
              <div className="flex-1">{children}</div>
              <Footer />
              <BottomNav />
            </ToastProvider>
          </UnreadProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}