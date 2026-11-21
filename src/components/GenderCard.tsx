import { setGenderAction } from "@/app/panel/gender-actions";
import {
  GENDER_FIELD,
  GENDER_SELF_DECLARED_NOTE,
  GENDERS,
  genderLabels,
} from "@/lib/gender-rules";

// Cinsiyeti henüz belirtilmemiş (eski) hesaplar için profil kartı.
export default function GenderCard() {
  return (
    <section
      aria-label="Cinsiyet bilgisi"
      className="rounded-3xl bg-white p-6 ring-1 ring-black/5 sm:p-8"
    >
      <h2 className="text-xl font-extrabold tracking-tight">
        Cinsiyetini belirt
      </h2>
      <p className="mt-2 text-sm text-muted">
        &quot;Sadece kadınlar&quot; ve &quot;sadece erkekler&quot; yolculuklarını kullanabilmek için
        cinsiyetini seçmelisin. Seçim bir kez yapılır, sonradan kendin
        değiştiremezsin.
      </p>
      <form action={setGenderAction} className="mt-4 flex flex-wrap gap-3">
        {GENDERS.map((option) => (
          <button
            key={option}
            type="submit"
            name={GENDER_FIELD}
            value={option}
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-lilac"
          >
            {genderLabels[option]}
          </button>
        ))}
      </form>
      <p className="mt-3 text-xs text-muted">{GENDER_SELF_DECLARED_NOTE}</p>
    </section>
  );
}
