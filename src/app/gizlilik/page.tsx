import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik ve veri notu | Eventra",
  description: "Eventra hangi verileri neden saklar, kısaca.",
};

const sections: { title: string; text: string }[] = [
  {
    title: "Hesap bilgilerin",
    text: "Görünen adın, e-posta adresin, aktif rolün ve hesabının oluşturulma zamanı saklanır. Parolan düz metin olarak değil, tek yönlü şifrelenmiş özet (scrypt) olarak saklanır; biz de parolanı göremeyiz. Parolanı Ayarlar sayfasından değiştirebilir ve diğer cihazlardaki açık oturumlarını kapatabilirsin. Açık oturumların kaydı, oturum anahtarının tek yönlü özetiyle tutulur.",
  },
  {
    title: "Yolculuk ve etkinlik verilerin",
    text: "Oluşturduğun ya da katıldığın yolculuklar, favori etkinliklerin, bildirimlerin ve (demo) bilet doğrulama kaydın saklanır. Yolculuk oluşturmak ve yolculuğa katılmak için o etkinliğin biletini doğrulamış olman gerekir. Demo etkinliklerde bu doğrulama bir simülasyondur, gerçek bir bilet sağlayıcıya sorulmaz. Bilet kodunun kendisi değil yalnızca özeti tutulur. Yolcu adları yalnızca ilgili yolculuğun sürücüsüne ve o yolculuğa katılan yolculara gösterilir.",
  },
  {
    title: "Harita ve konum bilgisi",
    text: "Yolculuk oluştururken ya da düzenlerken haritadan nokta seçersen, seçtiğin noktaların koordinatları ve hesaplanan rota (mesafe, süre, çizgi) yolculukla birlikte saklanır. Başlangıç ve varış noktaları yaklaşık 1 km hassasiyetle kaydedilir ve gösterilir, ev adresin tam olarak görünmez. Buluşma noktası tam konumla saklanır ve yolculuk sayfasını gören herkese gösterilir, bu yüzden herkese açık bir yer seç. Cihazının konumuna erişmeyiz.",
  },
  {
    title: "Yolcu talepleri",
    text: "Yolcu talebi verirsen varış yerin, tercih ettiğin saat, kişi sayın ve notun saklanır. Talep yalnızca bileti doğrulanmış, giriş yapmış kullanıcılara ve yalnızca ilk adınla gösterilir. Başkalarına yalnızca talep sayısı görünür. Talebe telefon, e-posta ya da bağlantı yazılamaz. Talebini istediğin zaman silebilirsin, bir yolculuğa katılınca da kendiliğinden silinir.",
  },
  {
    title: "Puanlama ve şikâyetler",
    text: "Aynı yolculukta olduğun kişileri puanlayabilir (1-5 yıldız, isteğe bağlı kısa yorum) ya da bir sorun yaşadıysan bildirebilirsin. Sürücülerin ortalama puanı ve değerlendirme sayısı herkese görünür, yorumlar ve şikâyetler görünmez. Şikâyetler şu an proje sahibi tarafından elle incelenir. Yolculuk silinse bile verilmiş puanlar kalır, böylece puan silinerek temizlenemez. Hesabını silersen senin verdiğin ve hakkındaki puanlar ile şikâyetler de silinir.",
  },
  {
    title: "Çerezler ve istatistik",
    text: "Tek çerez, oturumunu açık tutan eventra_session çerezidir (JavaScript ile okunamaz, 7 gün geçerlidir). Reklam ya da takip çerezi kullanmıyoruz. Ziyaret istatistikleri çerez kullanılmadan toplanır (sayfa görüntüleme, ülke, cihaz türü gibi).",
  },
  {
    title: "Güvenlik için tuttuklarımız",
    text: "Hatalı giriş denemeleri (e-posta adresi ve zaman) kısa süre tutulur ve temizlenir. Sahte kayıtları sınırlamak için kayıt sırasında ağ adresinin kendisi değil tek yönlü özeti kısa süre saklanır. Yolculuğa katılma, talep verme, adres arama ve rota hesabı gibi işlemlerde kötüye kullanımı sınırlamak için hangi kullanıcının hangi işlemi ne zaman yaptığı en fazla bir gün tutulur.",
  },
  {
    title: "Telefon bildirimi",
    text: "Bildirimleri açarsan tarayıcının verdiği abonelik bilgisi saklanır; kapatınca ya da çıkış yapınca bu cihazın aboneliği silinir. Hangi bildirim türlerinin telefona gönderileceği tercihin olarak saklanır. Bildirim metni yolcu adını içerebilir ve kilit ekranında görünebilir.",
  },
  {
    title: "Üçüncü taraflar",
    text: "Site Vercel üzerinde barındırılır, veriler Neon veritabanında tutulur; bu sağlayıcılar kendi sistem kayıtlarını tutabilir. Harita görüntüsü OpenFreeMap'ten, harita verisi OpenStreetMap katkıcılarından gelir: haritayı açtığında tarayıcın doğrudan bu hizmete bağlanır ve ağ adresin onlara ulaşır. Yer araması için yazdığın metin sunucumuz üzerinden OpenStreetMap'in Nominatim hizmetine, rota hesabı için seçtiğin noktalar OSRM (ya da yapılandırılmışsa OpenRouteService) hizmetine gönderilir, kim olduğun gönderilmez. Arama sonuçları ve rotalar, kullanıcıyla ilişkilendirilmeden bir süre önbellekte tutulur. Telefon bildirimleri tarayıcı üreticilerinin bildirim servisleri üzerinden iletilir. Gerçek etkinlikler gösterildiğinde etkinlik bilgileri biletimGO'dan alınır ve bilet bağlantısına tıkladığında biletimGO'nun kendi koşulları geçerli olur.",
  },
  {
    title: "Hesabını silme",
    text: "Profil, Ayarlar sayfasından parolanla hesabını silebilirsin. Hesabın, yolculukların ve harita bilgileri, katılımların, yolcu talepların, favorilerin, bildirimlerin, bildirim tercihlerin, verdiğin ve hakkındaki puanlar ile şikâyetler ve bildirim abonelikleri birlikte silinir. Yolculuğuna katılmış kişilere iptal bildirimi gider.",
  },
  {
    title: "Bu bir demo",
    text: "Eventra bir demo projesidir. Gerçek e-posta adresi ve gerçek parola kullanma. E-posta doğrulama ve unutulan parolayı sıfırlama yoktur. Bu sayfa kısa bir bilgilendirmedir, resmi bir gizlilik politikası ya da aydınlatma metni yerine geçmez.",
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