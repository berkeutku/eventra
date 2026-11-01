import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik ve veri notu | Eventra",
  description: "Eventra hangi verileri neden saklar, kısaca.",
};

const sections: { title: string; text: string }[] = [
  {
    title: "Hesap bilgilerin",
    text: "Görünen adın, e-posta adresin, aktif rolün ve hesabın oluşturulma zamanı saklanır. Parolan düz metin olarak değil, tek yönlü şifrelenmiş özet (scrypt) olarak saklanır; biz de parolanı göremeyiz.",
  },
  {
    title: "Yolculuk ve etkinlik verilerin",
    text: "Oluşturduğun ya da katıldığın yolculuklar, favori etkinliklerin, bildirimlerin ve (demo) bilet doğrulama kaydın saklanır. Bilet kodunun kendisi değil yalnızca özeti tutulur. Yolcu adları yalnızca ilgili yolculuğun sürücüsüne ve o yolculuğa katılan yolculara gösterilir.",
  },
  {
    title: "Çerezler ve istatistik",
    text: "Tek çerez, oturumunu açık tutan eventra_session çerezidir (JavaScript ile okunamaz, 7 gün geçerlidir). Reklam ya da takip çerezi kullanmıyoruz. Ziyaret istatistikleri çerez kullanılmadan toplanır (sayfa görüntüleme, ülke, cihaz türü gibi).",
  },
  {
    title: "Güvenlik için tuttuklarımız",
    text: "Hatalı giriş denemeleri (e-posta adresi ve zaman) kısa süre tutulur ve temizlenir. Sahte kayıtları sınırlamak için kayıt sırasında ağ adresinin kendisi değil tek yönlü özeti kısa süre saklanır.",
  },
  {
    title: "Telefon bildirimi",
    text: "Bildirimleri açarsan tarayıcının verdiği abonelik bilgisi saklanır; kapatınca ya da çıkış yapınca bu cihazın aboneliği silinir. Bildirim metni yolcu adını içerebilir ve kilit ekranında görünebilir.",
  },
  {
    title: "Üçüncü taraflar",
    text: "Site Vercel üzerinde barındırılır, veriler Neon veritabanında tutulur; bu sağlayıcılar kendi sistem kayıtlarını tutabilir. Telefon bildirimleri tarayıcı üreticilerinin bildirim servisleri üzerinden iletilir. Gerçek etkinlikler gösterildiğinde etkinlik bilgileri biletimGO'dan alınır ve bilet bağlantısına tıkladığında biletimGO'nun kendi koşulları geçerli olur.",
  },
  {
    title: "Hesabını silme",
    text: "Profil, Ayarlar sayfasından parolanla hesabını silebilirsin. Hesabın, yolculukların, katılımların, favorilerin, bildirimlerin ve bildirim abonelikleri birlikte silinir.",
  },
  {
    title: "Bu bir demo",
    text: "Eventra bir demo projesidir. Gerçek e-posta adresi ve gerçek parola kullanma. E-posta doğrulama ve parola sıfırlama yoktur. Bu sayfa kısa bir bilgilendirmedir, resmi bir gizlilik politikası ya da aydınlatma metni yerine geçmez.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Gizlilik ve veri notu
        </h1>
        <p className="mt-3 text-lg text-muted">
          Eventra hangi verileri neden saklar, kısaca.
        </p>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
              <h2 className="text-lg font-extrabold tracking-tight">
                {section.title}
              </h2>
              <p className="mt-2 leading-relaxed text-muted">{section.text}</p>
            </section>
          ))}
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm font-bold text-violet hover:underline"
        >
          &larr; Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}