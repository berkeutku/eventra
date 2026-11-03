// Veritabanı içermez: hem sunucu hem tarayıcı bileşenlerinden güvenle içe aktarılabilir.

export const PREF_TYPES = [
  "ride_joined",
  "ride_left",
  "ride_cancelled",
  "ride_updated",
] as const;

export type PrefType = (typeof PREF_TYPES)[number];

export const prefLabels: Record<PrefType, { title: string; text: string }> = {
  ride_joined: {
    title: "Yolcu katıldı",
    text: "Oluşturduğun yolculuğa biri katıldığında.",
  },
  ride_left: {
    title: "Yolcu ayrıldı",
    text: "Yolculuğundan biri ayrıldığında.",
  },
  ride_cancelled: {
    title: "Yolculuk iptal edildi",
    text: "Katıldığın bir yolculuk iptal edildiğinde.",
  },
  ride_updated: {
    title: "Yolculuk güncellendi",
    text: "Katıldığın yolculuğun saati, güzergâhı ya da masrafı değiştiğinde.",
  },
};