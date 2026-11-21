"use client";

import Link from "next/link";
import { useState } from "react";
import Icon, { type IconName } from "@/components/Icons";

type Role = "passenger" | "driver";

type Chapter = {
  time: string;
  title: string;
  story: string;
  details: string[];
  icon: IconName;
  tint: string;
};

const passengerStory: Chapter[] = [
  {
    time: "Kayıt · 2 dakika",
    title: "Hesabını aç",
    story:
      "Elif cumartesi akşamı bir konsere gidecek ama dönüşte gece yarısı tek başına yol bulmayı düşünmek canını sıkıyor. Eventra'ya girip hesap açıyor.",
    details: [
      "Kayıtta ilk soru cinsiyetin (kadın / erkek). Bu bilgi, “yalnızca kadınlarla” ya da “yalnızca erkeklerle” yolculuk seçeneğinin çalışması içindir; profilinde görünür ve kayıttan sonra değiştirilemez. Kendi beyanına dayanır, belgeyle doğrulanmaz.",
      "Ad, e-posta ve parola yeterli. Parolan şifrelenerek saklanır. Eventra şu an bir demo: gerçek e-posta adresi ve gerçek bir parola kullanma.",
      "İstersen Profilim sayfasında fotoğraf, kısa bir tanıtım yazısı, şehir ve ilgi alanları ekleyebilirsin. Zorunlu değil ama diğer yolcular seni tanıdıkça güven artar. Fotoğrafın ve profilin yalnızca giriş yapmış kullanıcılara görünür; arama motorlarında çıkmaz.",
    ],
    icon: "user",
    tint: "bg-lilac text-violet",
  },
  {
    time: "Etkinlik sayfası",
    title: "Etkinliği bul ve biletini doğrula",
    story:
      "Elif etkinlik listesinden konserini buluyor ve sayfasını açıyor. Yolculuklara katılabilmek için önce o etkinliğe gerçekten gideceğini göstermesi gerekiyor.",
    details: [
      "Etkinlik sayfasındaki bilet doğrulama bölümüne bilet kodunu (PNR) giriyorsun. Kod “EVT” ile başlar, ardından 6 karakter gelir; boşluk ve tire fark etmez.",
      "Bu doğrulama şu an simülasyondur: kod yalnızca biçim ve sağlama karakteri açısından denenir, gerçek bir bilet servisine sorulmaz. Demo için deneme kodu üretebilirsin.",
      "Doğrulama olmadan ne yolculuk oluşturabilir ne de bir yolculuğa katılabilirsin. Bu kural sunucuda da denetlenir; ekranı atlatarak aşılamaz.",
      "Gerçek (iş ortağı) etkinliklerde yolculuk, gerçek bilet doğrulaması hazır olana kadar kapalıdır; sayfada bunu açıkça görürsün.",
    ],
    icon: "ticket",
    tint: "bg-peach text-coral-ink",
  },
  {
    time: "Yolculuk listesi",
    title: "Sana uyan yolculuğu seç",
    story:
      "Listede o etkinlikten dönecek birkaç yolculuk var. Elif her kartta kimin sürdüğünü, nereden kalkılacağını ve kişi başı ne kadar düşeceğini tek bakışta görüyor.",
    details: [
      "Her kartta: kalkış ve varış, buluşma noktası, kalkış saati, tahmini süre, boş koltuk sayısı, kişi başı tahmini pay ve sürücünün fotoğrafı, puanı ve profili.",
      "Sürücünün profiline tıklayıp tanıtım yazısını ve geçmiş puanlarını okuyabilirsin.",
      "Kartta “yalnızca kadınlar” ya da “yalnızca erkekler” rozeti görürsen o yolculuğa yalnızca o cinsiyetten kullanıcılar katılabilir. Rozet yoksa yolculuk karışıktır.",
      "Kişi başı pay şöyle hesaplanır: toplam masraf ÷ (boş koltuk + 1). Sürücü de payın içindedir. Örnek: 600 TL masraf, 3 boş koltuk → 600 ÷ 4 = 150 TL. Eventra para toplamaz; bu yalnızca tahmindir, ödemeyi kendi aranızda yaparsınız.",
    ],
    icon: "route",
    tint: "bg-sea text-mint-ink",
  },
  {
    time: "Katılma",
    title: "Koltuğunu ayır",
    story:
      "Elif “Katıl” diyor. Aynı anda başka biri de son koltuğa basmış olsa bile sistem yalnızca birine yer verir; diğerine nazik bir uyarı gösterir.",
    details: [
      "Katılma işlemi sunucuda kilitli çalışır: koltuk sayısı asla aşılmaz, aynı koltuğa iki kişi yazılmaz.",
      "Bilet doğrulaman ve yolculuğun cinsiyet tercihi katılma anında bir kez daha denetlenir.",
      "Planın değişirse yolculuktan ayrılabilirsin; koltuk hemen başkasına açılır.",
      "Aradığın yolculuk yoksa boş dönmen gerekmiyor: etkinlik için bir talep bırakırsın, uygun bir yolculuk açıldığında bildirim alırsın (bildirimler uygulama içinde ve izin verirsen telefonuna push olarak gelir; e-posta gönderilmez).",
    ],
    icon: "users",
    tint: "bg-lilac text-violet",
  },
  {
    time: "Etkinlik günü",
    title: "Buluş, yola çık, yakınına haber ver",
    story:
      "Konser bitti. Elif yolculuk sayfasını açıyor: buluşma noktası, saat, sürücünün araç bilgisi ve yolculuk sohbeti orada.",
    details: [
      "Sohbet yalnızca o yolculuktakilere açıktır. Link paylaşımı engellenir. Etkinlikten 24 saat sonra sohbet salt okunur olur, mesajlar 60 gün sonra silinir.",
      "Sürücü “Yola çıktım” ve “Vardım” düğmeleriyle durumu ilerletir (planlandı → yolda → vardı; geri alınmaz). Bu düğmeler etkinlikten 3 saat önce açılır, bitişten 24 saat sonra kapanır.",
      "“Güvenli paylaşım bağlantısı” ile bir yakınına güzergâhı, saati, durumu ve araç bilgisini gösteren bir sayfa gönderebilirsin. Yolcu adları görünmez, bağlantı 24 saat geçerlidir (günde en fazla 5 bağlantı).",
    ],
    icon: "car",
    tint: "bg-peach text-coral-ink",
  },
  {
    time: "Sonrası",
    title: "Puanla, sorun olduysa bildir",
    story:
      "Elif eve sağ salim vardı. Yolculuk sayfasına dönüp sürücüyü puanlıyor; böylece sonraki yolcular da kime bineceğini bilir.",
    details: [
      "Puanlama etkinlik bittikten sonra açılır ve 30 gün açık kalır. İstersen kısa bir yorum da bırakabilirsin.",
      "Bir sorun yaşadıysan (gelmedi, güvensiz sürüş, uygunsuz davranış gibi) aynı yerden bildirim yaparsın. Bildirimler proje sahibi tarafından elle incelenir; Eventra şu an 7/24 bir destek ekibi değildir. Acil durumda 112'yi ara.",
    ],
    icon: "star",
    tint: "bg-sea text-mint-ink",
  },
];

const driverStory: Chapter[] = [
  {
    time: "Hazırlık",
    title: "Hesap ve bilet doğrulama",
    story:
      "Mert aynı konsere arabasıyla gidiyor ve dönüşte boş koltukları var. Yakıt masrafını paylaşabileceği insanlar arıyor.",
    details: [
      "Hesap açarken cinsiyetini seçersin; bu, yolculuğuna kimlerin katılabileceğini belirleyen seçeneklerin temelidir.",
      "Yolculuk açabilmek için önce o etkinliğin biletini doğrulaman gerekir (şu an demo simülasyonu). Sürücü olmak ayrı bir hesap istemez: aynı hesapla hem yolcu hem sürücü olabilirsin.",
      "Eventra ehliyet ya da araç belgesi doğrulamaz. Sürüş sorumluluğu sürücüdedir; ehliyetin ve aracın yasal olarak kullanıma uygun olması senin beyanındır.",
    ],
    icon: "ticket",
    tint: "bg-lilac text-violet",
  },
  {
    time: "Yolculuk oluşturma",
    title: "Yolculuğunu tarif et",
    story:
      "Mert “Yolculuk oluştur”a basıyor ve adım adım ilerleyen formu dolduruyor.",
    details: [
      "Nereden nereye gideceğin, buluşma noktası (örneğin “Otogar girişi”), kalkış saati, tahmini süre, boş koltuk sayısı ve toplam masraf.",
      "Sistem kişi başı payı anında gösterir: toplam masraf ÷ (koltuk + 1). 600 TL ve 3 koltuk için kişi başı 150 TL.",
      "“Kimlerle yolculuk edeceksin?” adımında karışık, yalnızca kadınlar ya da yalnızca erkekler seçeneklerinden birini seçersin. Sana uygun olmayan seçenek gösterilmez; örneğin erkek bir sürücü “yalnızca kadınlar” yolculuğu açamaz.",
      "Son adımda bir beyan onaylarsın. Yolculuk oluşturma sınırı saatte 5, günde 15'tir; bu, sahte ya da spam ilanları önlemek içindir.",
    ],
    icon: "route",
    tint: "bg-peach text-coral-ink",
  },
  {
    time: "Yolculuk yayında",
    title: "Yolcular katılır, sen yönetirsin",
    story:
      "Yolculuk listede görünüyor. Birkaç saat içinde iki kişi katılıyor; bir koltuk daha açık.",
    details: [
      "Katılanlar yolculuk sayfanda görünür. Koltuk sayısı sunucuda kilitli çalışır, fazla kişi alınmaz.",
      "Plan değişirse bilgileri düzenleyebilirsin; değişiklik katılanlara bildirim olarak gider.",
      "Aynı etkinlik için yolculuk arayan biri varsa, yolculuğun ona uyuyorsa (ve cinsiyet tercihi izin veriyorsa) bildirim gider.",
    ],
    icon: "users",
    tint: "bg-sea text-mint-ink",
  },
  {
    time: "Etkinlik günü",
    title: "Araç bilgisi, yola çıkış, varış",
    story:
      "Etkinlik bitmek üzere. Mert yolculuk sayfasında araç bilgisini (örneğin “Beyaz Corolla, 33 ABC 123”) yazıyor ki yolcular kime bineceğini tanısın.",
    details: [
      "Araç bilgisi isteğe bağlıdır, yolcular ve paylaşım bağlantısı görür.",
      "Buluşunca “Yola çıktım”, varınca “Vardım” düğmesine basarsın. Durum yalnızca ileri gider, bu düğmeler etkinlikten 3 saat önce açılır ve bitişten 24 saat sonra kapanır.",
      "Yolculuk sohbetinden yolcularla buluşma ayrıntılarını konuşabilirsin; telefon numarası ve link paylaşımına gerek yok.",
    ],
    icon: "car",
    tint: "bg-lilac text-violet",
  },
  {
    time: "Sonrası",
    title: "Puanlar ve masrafın paylaşımı",
    story:
      "Herkes evine vardı. Mert yolcuları puanlıyor, yolcular da onu. Masrafı kendi aralarında, anlaştıkları şekilde paylaşıyorlar.",
    details: [
      "Eventra ödeme almaz, aracılık etmez, komisyon kesmez. Yolculuk kâr amacı olmayan masraf paylaşımı olarak düşünülmüştür; kişi başı pay sana yalnızca fikir verir.",
      "Puanlar etkinlik sonrası 30 gün boyunca verilebilir ve profilinde görünür. Sorun olursa bildirim yapabilirsin; bildirimler elle incelenir.",
    ],
    icon: "star",
    tint: "bg-peach text-coral-ink",
  },
];

const guarantees: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Para Eventra'dan geçmez",
    text: "Ödeme havuzu, emanet ya da komisyon yok. Masraf paylaşımı tahmini bir hesaptır; ödemeyi yolculuktakiler kendi aralarında halleder.",
    icon: "wallet",
  },
  {
    title: "Bilet olmadan yolculuk olmaz",
    text: "Yolculuk açmak ve katılmak için etkinlik biletini doğrulamak gerekir. Bu kural arayüzde değil, sunucuda uygulanır.",
    icon: "ticket",
  },
  {
    title: "Yakınına haber ver",
    text: "24 saat geçerli, yolcu adlarını göstermeyen bir paylaşım bağlantısıyla yolculuğunu yakınların takip edebilir.",
    icon: "shield",
  },
  {
    title: "Kiminle gideceğini sen seç",
    text: "Karışık, yalnızca kadınlar ya da yalnızca erkekler. Seçim yalnızca isteyenler içindir; kimseye zorlanmaz.",
    icon: "users",
  },
  {
    title: "Herkes puanlanır",
    text: "Etkinlikten sonra 30 gün boyunca puan ve yorum bırakılabilir; sorun bildirimleri elle incelenir.",
    icon: "star",
  },
  {
    title: "Verin sende",
    text: "Profilin ve fotoğrafın yalnızca giriş yapmış kullanıcılara görünür. Sohbet mesajları 60 gün sonra silinir. Verilerini dışa aktarabilir ya da hesabını silebilirsin.",
    icon: "pin",
  },
];

const honest: { label: string; items: string[] }[] = [
  {
    label: "Eventra şunları yapar",
    items: [
      "Aynı etkinliğe gidenleri ortak dönüşte buluşturur.",
      "Kişi başı masraf payını hesaplar.",
      "Yolculuk günü sohbet, durum ve güvenli paylaşım bağlantısı sunar.",
      "Puan ve bildirim sistemiyle güveni artırmaya çalışır.",
    ],
  },
  {
    label: "Eventra şunları yapmaz",
    items: [
      "Para toplamaz, ödeme veya komisyon almaz.",
      "Sürücünün ehliyetini, aracını ya da kimliğini doğrulamaz.",
      "Gerçek bilet servisine bağlı değildir; bilet doğrulaması bir demodur.",
      "7/24 canlı destek vermez; acil durumda 112'yi ara.",
    ],
  },
];

function ChapterList({ chapters }: { chapters: Chapter[] }) {
  return (
    <ol className="relative mt-10 space-y-6 sm:space-y-8">
      <span
        aria-hidden="true"
        className="absolute bottom-6 left-7 top-6 hidden border-l-[3px] border-dotted border-violet/25 sm:block"
      />
      {chapters.map((chapter, index) => (
        <li key={chapter.title} className="relative sm:pl-20">
          <span
            className={`relative z-10 mb-3 grid h-14 w-14 place-items-center rounded-3xl sm:absolute sm:left-0 sm:top-0 sm:mb-0 ${chapter.tint}`}
          >
            <Icon name={chapter.icon} className="h-7 w-7" />
            <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-night text-xs font-extrabold text-white">
              {index + 1}
            </span>
          </span>
          <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-widest text-violet">
              {chapter.time}
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
              {chapter.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-ink">
              {chapter.story}
            </p>
            <div className="mt-4 rounded-2xl bg-soft p-4">
              <p className="text-sm font-bold text-ink">Sistemde tam olarak ne oluyor?</p>
              <ul className="mt-2 space-y-2">
                {chapter.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex gap-2 text-sm leading-relaxed text-muted"
                  >
                    <Icon
                      name="check"
                      className="mt-0.5 h-4 w-4 shrink-0 text-mint-ink"
                    />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorks() {
  const [role, setRole] = useState<Role>("passenger");

  return (
    <section id="nasil-calisir" className="bg-soft px-6 py-12 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-violet">
          çözüm çok basit
        </p>
        <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight sm:text-4xl">
          Nasıl çalışır? Baştan sona, hiçbir şeyi atlamadan
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-muted">
          Konsere, maça ya da tiyatroya gitmek kolay; asıl mesele gece geç
          saatte eve dönmek. Eventra aynı etkinlikten dönen insanları tanıştırır
          ve masrafı paylaşmalarını sağlar. Aşağıda iki küçük hikâye var: önce
          yolcunun, sonra sürücünün gözünden. Her adımın altında sistemin
          arka planda ne yaptığını da yazdık.
        </p>

        <div
          role="tablist"
          aria-label="Rol seç"
          className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-sm"
        >
          {(
            [
              ["passenger", "Yolcuyum"],
              ["driver", "Sürücüyüm"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={role === key}
              onClick={() => setRole(key)}
              className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                role === key ? "bg-night text-white" : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ChapterList
          chapters={role === "passenger" ? passengerStory : driverStory}
        />

        <div className="mt-14">
          <h3 className="text-center text-xl font-extrabold tracking-tight sm:text-3xl">
            Kafanda soru kalmasın
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guarantees.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-line bg-white p-5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lilac text-violet">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <p className="mt-3 font-extrabold">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {honest.map((block, index) => (
            <div
              key={block.label}
              className={`rounded-3xl p-6 ${index === 0 ? "bg-sea" : "bg-peach"}`}
            >
              <p
                className={`font-extrabold ${index === 0 ? "text-mint-ink" : "text-coral-ink"}`}
              >
                {block.label}
              </p>
              <ul className="mt-3 space-y-2">
                {block.items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-ink">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted">
          Eventra şu an bir demodur. Etkinlikler ve bilet doğrulaması kurgusaldır;
          amaç, yolculuk deneyiminin nasıl çalışacağını göstermektir.
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/kayit"
            className="inline-flex rounded-full bg-night px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Hesap oluştur ve dene
          </Link>
        </div>
      </div>
    </section>
  );
}
