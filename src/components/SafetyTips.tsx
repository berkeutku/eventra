import { cardClass } from "@/components/ui/Card";

const tips = [
  "Buluşmayı kalabalık, aydınlık ve herkese açık bir noktada yap.",
  "Yolculuk günü kartındaki paylaşım bağlantısıyla güzergâhı güvendiğin birine gönder.",
  "Eventra ödeme almaz, masraf paylaşımı kendi aranızdadır. Önceden ödeme ya da farklı bir yere gitme isteklerine dikkat et.",
  "Telefon numarası ve tam plaka gibi kişisel bilgileri paylaşmadan önce iyi düşün.",
  "Planın değişirse yolculuktan mümkün olduğunca erken ayrıl. Sürücüye bildirim gider ve koltuk başkasına açılır.",
  "Kendini rahat hissetmezsen yolculuktan ayrılabilirsin. Sorunu geri bildirim bölümünden bildir.",
  "Acil bir durumda hemen 112'yi ara.",
];

export default function SafetyTips() {
  return (
    <details className={`${cardClass} group`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-2xl font-extrabold tracking-tight [&::-webkit-details-marker]:hidden">
        Güvenli yolculuk için
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lilac text-lg text-violet transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <ul className="mt-5 space-y-3">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-3 text-sm text-ink">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-mint"
            />
            {tip}
          </li>
        ))}
      </ul>
    </details>
  );
}
