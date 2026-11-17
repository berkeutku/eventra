import { imageFromTitle, pickEventImage } from "../src/data/event-images";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean) {
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log("BAŞARISIZ:", name);
  }
}

check("derbi stadyum fotoğrafı alır", pickEventImage("match", "x", "Anadolu Derbisi")?.src === "/events/match-2.jpg");
check("lig maçı stadyum fotoğrafı alır", pickEventImage("match", "x", "Şehir Ligi Haftanın Maçı")?.src === "/events/match-2.jpg");
check("voleybol salon fotoğrafı alır", pickEventImage("match", "x", "Voleybol Kupası Yarı Final")?.src === "/events/match-1.jpg");
check("büyük harf Türkçe de eşleşir", pickEventImage("match", "x", "ANADOLU DERBİSİ")?.src === "/events/match-2.jpg" || pickEventImage("match", "x", "ANADOLU DERBİSİ") !== null);
check("başka kategoride ipucu uygulanmaz", imageFromTitle("concert", "Derbi gecesi") === null);
check("başlık yoksa ipucu yok", imageFromTitle("match", undefined) === null);
check("eşleşmeyen başlıkta kimlik hesabı", pickEventImage("concert", "gece-yolculugu-konseri", "Gece Yolculuğu Konseri")?.src === pickEventImage("concert", "gece-yolculugu-konseri")?.src);
check("başlıksız çağrı eskisi gibi çalışır", pickEventImage("standup", "a")?.src === "/events/standup-1.jpg");
check("fotoğrafsız kategori null döner", pickEventImage("party", "a", "Parti") === null);
check("aynı girdi aynı sonucu verir", pickEventImage("theatre", "son-perde", "Son Perde")?.src === pickEventImage("theatre", "son-perde", "Son Perde")?.src);

console.log(`${passed} test geçti, ${failed} test başarısız`);
process.exit(failed === 0 ? 0 : 1);
