import {
  AVATAR_MAX_BYTES,
  INTEREST_KEYS,
  MAX_BIO,
  MAX_INTERESTS,
  THEME_KEYS,
  avatarFileError,
  initialsOf,
  memberSinceLabel,
  parseInterests,
  parseTheme,
  prepareBio,
  prepareCity,
  profileCompleteness,
  profileThemes,
} from "../src/lib/profile-rules";

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

// Tema
check("boş tema varsayılan olur", parseTheme("") === "violet");
check("null tema varsayılan olur", parseTheme(null) === "violet");
check("geçerli tema kabul edilir", parseTheme("ocean") === "ocean");
check("bilinmeyen tema reddedilir", parseTheme("neon") === null);
check("prototip anahtarı tema sayılmaz", parseTheme("constructor") === null);
check("her temanın gradyanı var", THEME_KEYS.every((key) => profileThemes[key].gradient.startsWith("bg-linear-to-br")));

// İlgi alanları
const okInterests = parseInterests(["concert", "match", "concert"]);
check("tekrarlar tek sayılır", okInterests.ok && okInterests.value.length === 2);
check("boş liste geçerli", parseInterests([]).ok === true);
check("geçersiz anahtar reddedilir", parseInterests(["concert", "casino"]).ok === false);
check("metin olmayan değer reddedilir", parseInterests([42]).ok === false);
check("sınır aşılınca reddedilir", parseInterests(INTEREST_KEYS.slice(0, MAX_INTERESTS + 1) as unknown as string[]).ok === false);
check("tam sınır kabul edilir", parseInterests(INTEREST_KEYS.slice(0, MAX_INTERESTS) as unknown as string[]).ok === true);

// Hakkımda
const bioOk = prepareBio("Merhaba!\n\n\n\nKonser sever, yolculuğu sever.");
check("fazla boş satırlar ikiye iner", bioOk.ok && bioOk.value === "Merhaba!\n\nKonser sever, yolculuğu sever.");
check("boş metin null olur", (() => { const r = prepareBio("   \n  "); return r.ok && r.value === null; })());
check("undefined null olur", (() => { const r = prepareBio(undefined); return r.ok && r.value === null; })());
check("tam sınır kabul edilir", prepareBio("a".repeat(MAX_BIO)).ok === true);
check("sınırı aşan reddedilir", prepareBio("a".repeat(MAX_BIO + 1)).ok === false);
check("telefon reddedilir", prepareBio("Beni ara 0532 123 45 67").ok === false);
check("e-posta reddedilir", prepareBio("mail: ben@ornek.com").ok === false);
check("kullanıcı adı (@) reddedilir", prepareBio("insta: @berke").ok === false);
check("bağlantı reddedilir", prepareBio("https://ornek.com/ben").ok === false);
check("alan adı reddedilir", prepareBio("sitem ornek.com").ok === false);
check("kontrol karakterleri temizlenir", (() => { const r = prepareBio("Selam\u0000​dünya"); return r.ok && r.value === "Selam dünya"; })());
check("metin olmayan değer reddedilir", prepareBio(123).ok === false);
check("çok uzun girdi hızla reddedilir", prepareBio("a".repeat(MAX_BIO * 9)).ok === false);

// Şehir
check("Türkçe harfli şehir kabul edilir", (() => { const r = prepareCity("  Şanlıurfa "); return r.ok && r.value === "Şanlıurfa"; })());
check("boşluklu şehir kabul edilir", (() => { const r = prepareCity("Kahramanmaraş  Merkez"); return r.ok && r.value === "Kahramanmaraş Merkez"; })());
check("boş şehir null olur", (() => { const r = prepareCity(""); return r.ok && r.value === null; })());
check("rakamlı şehir reddedilir", prepareCity("Mersin 33").ok === false);
check("çok uzun şehir reddedilir", prepareCity("a".repeat(41)).ok === false);
check("özel karakterli şehir reddedilir", prepareCity("<b>Adana</b>").ok === false);
check("tek harf reddedilir", prepareCity("A").ok === false);

// Fotoğraf
function jpeg(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes[length - 2] = 0xff;
  bytes[length - 1] = 0xd9;
  return bytes;
}
check("geçerli JPEG kabul edilir", avatarFileError(jpeg(2000)) === null);
check("boş dosya reddedilir", avatarFileError(new Uint8Array(0)) !== null);
check("çok büyük dosya reddedilir", avatarFileError(jpeg(AVATAR_MAX_BYTES + 1)) !== null);
check("tam sınır kabul edilir", avatarFileError(jpeg(AVATAR_MAX_BYTES)) === null);
check("PNG imzası reddedilir", avatarFileError(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])) !== null);
check("SVG metni reddedilir", avatarFileError(new TextEncoder().encode("<svg onload=alert(1)></svg>")) !== null);
check("sonu kesik JPEG reddedilir", (() => { const b = jpeg(500); b[499] = 0; return avatarFileError(b) !== null; })());

// Baş harf ve üyelik tarihi
check("Türkçe baş harf", initialsOf("ışık") === "I");
check("boş ad soru işareti", initialsOf("   ") === "?");
check("üyelik ayı", memberSinceLabel("2026-11-17T10:00:00Z") === "Kasım 2026");
check("ay sonu Türkiye saatiyle ertesi aya geçer", memberSinceLabel("2026-10-31T22:30:00Z") === "Kasım 2026");
check("geçersiz tarih boş döner", memberSinceLabel("yok") === "");

// Doluluk
check("boş profil %0", profileCompleteness({ hasAvatar: false, bio: null, city: null, interestCount: 0, hasGender: false }).percent === 0);
check("tam profil %100", profileCompleteness({ hasAvatar: true, bio: "x", city: "Adana", interestCount: 2, hasGender: true }).percent === 100);
check("eksikler listelenir", profileCompleteness({ hasAvatar: true, bio: null, city: "Adana", interestCount: 2, hasGender: true }).missing.join() === "Hakkımda yaz");
check("kısmi profil %60", profileCompleteness({ hasAvatar: true, bio: "x", city: "Adana", interestCount: 0, hasGender: false }).percent === 60);

console.log(`${passed} test geçti, ${failed} test başarısız`);
process.exit(failed === 0 ? 0 : 1);
