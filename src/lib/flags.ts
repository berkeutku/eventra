// Gerçek (biletimGO) etkinliklerin sitede gösterilip gösterilmeyeceği. Varsayılan: kapalı.
// Bu dosya veritabanı içermez, bu yüzden altbilgi gibi hafif bileşenlerden de çağrılabilir.
export function realEventsEnabled(): boolean {
  return process.env.SHOW_REAL_EVENTS === "1";
}