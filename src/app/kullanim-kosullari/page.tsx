import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım koşulları | Eventra",
  description:
    "Eventra demo sürümünün kullanım koşulları: hizmetin kapsamı, kullanıcı sorumlulukları ve sınırlar.",
};

const sections: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. Eventra nedir?",
    paragraphs: [
      "Eventra, aynı etkinliğe katılan kişilerin etkinlik sonrası ortak yolculuk planlamasına yardımcı olan, geliştirme aşamasındaki bir platformdur. Şu an demo ve pilot sürümü olarak sunulmaktadır.",
      "Eventra bir taşımacılık, taksi ya da araç kiralama hizmeti değildir. Bilet satmaz, kullanıcılardan ödeme almaz.",
    ],
  },
  {
    title: "2. Hesap ve kullanım",
    paragraphs: [
      "Hesap oluşturarak bu koşulları kabul etmiş olursun. Hesabındaki bilgilerin doğru olmasından ve parolanı güvende tutmaktan sen sorumlusun.",
      "Demo sürümünde gerçek e-posta adresi ve gerçek parola kullanmaman önerilir. Hesabını istediğin zaman profilinden silebilirsin.",
      "Eventra'yı kullanmak için 18 yaşını doldurmuş olmalısın.",
      "Kayıtta belirttiğin cinsiyet bilgisinin doğru olmasından sen sorumlusun. Cinsiyetini yanlış beyan etmek yasaktır ve hesabının kısıtlanmasına ya da kapatılmasına yol açabilir. Bu bilgi bir kez belirlenir, sonradan kendin değiştiremezsin.",
    ],
  },
  {
    title: "3. Bilet doğrulama",
    paragraphs: [
      "Yolculuk oluşturmak ve yolculuğa katılmak için ilgili etkinliğin bilet doğrulaması istenir. Bu doğrulama şu an bir simülasyondur: kod yalnızca biçim ve sağlama karakteri açısından kontrol edilir, gerçek bir bilet sağlayıcısına ya da e-Devlet'e bağlantı yoktur.",
      "Doğrulama rozeti, kişinin kimliğinin ya da biletinin gerçekliğinin garantisi değildir.",
    ],
  },
  {
    title: "4. Yolculuklar ve sorumluluk",
    paragraphs: [
      "Yolculuklar sürücü ile yolcular arasında kendi aralarında kurulan bir düzenlemedir. Eventra bu düzenlemenin tarafı değildir ve yolculuğun güvenliğini, zamanında gerçekleşmesini ya da kullanıcıların davranışlarını garanti etmez.",
      "Sürücü, geçerli ehliyete, aracın ruhsat, muayene ve zorunlu sigortasına sahip olmaktan ve trafik kurallarına uymaktan sorumludur. Sürücü her yolculuk oluşturduğunda bunu ayrıca beyan eder; Eventra bu beyanı doğrulamaz. Yolcular yolculuğa katılıp katılmamaya kendi kararlarıyla karar verir.",
      "Yolculuklar karma, yalnızca kadınlar ya da yalnızca erkekler için açılabilir. Bu seçenek kullanıcıların kendi cinsiyet beyanına dayanır; Eventra cinsiyeti kimlikle doğrulamaz ve bu seçeneğin bir güvenlik garantisi olduğunu iddia etmez.",
      "Kendini güvende hissetmediğin bir yolculuğa katılma, yolculuk sırasında rahatsız olursan yolculuğu sonlandır. Acil durumda 112'yi ara.",
    ],
  },
  {
    title: "5. Yolculuktan ayrılma ve iptal",
    paragraphs: [
      "Planın değişirse katıldığın yolculuktan ayrılabilirsin. Ayrıldığında sürücüye bildirim gider ve koltuk başka bir yolcuya açılır. Lütfen bunu mümkün olduğunca erken yap; son dakikada ayrılmak ya da hiç haber vermeden gelmemek sürücüyü ve diğer yolcuları mağdur eder.",
      "Sürücü bir yolculuğu iptal ederse katılan yolculara bildirim gider. Tekrarlayan son dakika iptalleri ve habersiz gelmeme şikâyet konusu olabilir ve hesabın kısıtlanmasına yol açabilir. Eventra şu an iptal için ceza ya da ücret uygulamaz.",
    ],
  },
  {
    title: "6. Masraf paylaşımı",
    paragraphs: [
      "Eventra'da gösterilen tutarlar yol masrafının eşit bölüşülmesine dair tahminlerdir. Eventra para toplamaz, ödeme aracılığı yapmaz ve emanet sistemi sunmaz.",
      "Masraf paylaşımı kâr amacı gütmemelidir. Sürücü bu hizmeti ticari yolcu taşımacılığı olarak sunamaz, yalnızca yol masrafına ortak olunmasını isteyebilir. Ödemenin nasıl ve ne zaman yapılacağı kullanıcıların kendi aralarındaki konudur.",
    ],
  },
  {
    title: "7. Yasak davranışlar",
    paragraphs: [
      "Aşağıdakiler yasaktır: yanlış ya da yanıltıcı bilgi vermek, başka birini taklit etmek, taciz, tehdit ya da ayrımcılık içeren davranışlar, sohbet ve taleplerde telefon, e-posta, bağlantı gibi iletişim bilgisi paylaşmak, sistemi otomatik araçlarla zorlamak ya da kötüye kullanmak, ticari yolcu taşımacılığı yapmak.",
      "Profil fotoğrafı ve “hakkımda” metni sana ait olmalı ve başkalarını rahatsız etmemelidir. Başkasına ait fotoğraf, müstehcen, şiddet içeren, nefret ya da ayrımcılık içeren görsel ve metinler yasaktır; hakkımda metnine telefon, e-posta, kullanıcı adı ya da bağlantı yazılamaz. Kurallara aykırı içerik uyarı yapılmadan kaldırılabilir.",
      "Bu kuralları ihlal eden hesaplar uyarı yapılmadan kısıtlanabilir ya da kapatılabilir.",
    ],
  },
  {
    title: "8. Bildirim ve şikâyet",
    paragraphs: [
      "Uygunsuz bir davranışla karşılaşırsan ilgili kullanıcıyı uygulama içinden bildirebilirsin. Bildirimler incelenir, ancak demo sürümünde yanıt süresi ya da sonuç garanti edilmez.",
    ],
  },
  {
    title: "9. Kişisel veriler",
    paragraphs: [
      "Hangi verilerin neden işlendiği ve nasıl silindiği Gizlilik ve veri notu sayfasında anlatılmıştır. Bu koşullar ile gizlilik notu birlikte okunmalıdır.",
    ],
  },
  {
    title: "10. Üçüncü taraflar",
    paragraphs: [
      "Etkinlik bilgileri, iş ortağı platformlardan alınabilir. Biletler Eventra tarafından değil ilgili bilet sağlayıcısı tarafından satılır. Bilet satın alma, iade ve etkinlikle ilgili konular o sağlayıcının kendi koşullarına tabidir.",
    ],
  },
  {
    title: "11. Sorumluluğun sınırı",
    paragraphs: [
      "Eventra bir demo olarak \"olduğu gibi\" sunulur. Kesintisiz ya da hatasız çalışacağı, verilerin her zaman doğru olacağı garanti edilmez. Yasaların izin verdiği ölçüde Eventra, kullanıcılar arasındaki yolculuklardan, kullanıcı davranışlarından ya da hizmetin kesintiye uğramasından doğan zararlardan sorumlu tutulamaz.",
    ],
  },
  {
    title: "12. Değişiklikler",
    paragraphs: [
      "Eventra gelişmeye devam ettiği için bu koşullar zaman zaman güncellenebilir. Güncel hâli her zaman bu sayfadadır. Önemli bir değişiklikten sonra hizmeti kullanmaya devam etmen, güncel koşulları kabul ettiğin anlamına gelir.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-violet hover:underline"
        >
          &larr; Ana sayfa
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Kullanım koşulları
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Eventra şu an bir demo ve pilot çalışma. Kullanmadan önce aşağıdaki
          koşulları okumanı rica ederiz. Sorularını Gizlilik ve veri notu
          sayfasındaki iletişim yoluyla iletebilirsin.
        </p>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
            >
              <h2 className="text-xl font-extrabold tracking-tight">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted">
                {section.paragraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          Ayrıca bkz.{" "}
          <Link href="/gizlilik" className="font-bold text-violet hover:underline">
            Gizlilik ve veri notu
          </Link>
          .
        </p>
      </div>
    </main>
  );
}