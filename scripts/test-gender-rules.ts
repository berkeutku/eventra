import {
  driverPolicyMessage,
  genderCanBeSet,
  joinPolicyMessage,
  parseGender,
  parseRidePolicy,
  policyAllowsGender,
  policyOptionsFor,
  policyRequiredGender,
} from "../src/lib/gender-rules";

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

// Cinsiyet ayrıştırma
check("female geçerli", parseGender("female") === "female");
check("male geçerli", parseGender("male") === "male");
check("boş metin geçersiz", parseGender("") === null);
check("başka değer geçersiz", parseGender("other") === null);
check("null geçersiz", parseGender(null) === null);
check("büyük harf geçersiz", parseGender("Female") === null);

// Yolculuk türü ayrıştırma
check("alan yoksa karma", parseRidePolicy(null) === "mixed");
check("undefined karma", parseRidePolicy(undefined) === "mixed");
check("boş metin karma", parseRidePolicy("") === "mixed");
check("women_only geçerli", parseRidePolicy("women_only") === "women_only");
check("men_only geçerli", parseRidePolicy("men_only") === "men_only");
check("bilinmeyen tür geçersiz", parseRidePolicy("everyone") === null);

// Gereken cinsiyet
check("karma için gereken yok", policyRequiredGender("mixed") === null);
check("kadınlar için kadın", policyRequiredGender("women_only") === "female");
check("erkekler için erkek", policyRequiredGender("men_only") === "male");

// Katılım izni
check("karma: kadın girer", policyAllowsGender("mixed", "female"));
check("karma: erkek girer", policyAllowsGender("mixed", "male"));
check("karma: cinsiyeti olmayan girer", policyAllowsGender("mixed", null));
check("kadınlar: kadın girer", policyAllowsGender("women_only", "female"));
check("kadınlar: erkek giremez", !policyAllowsGender("women_only", "male"));
check("kadınlar: cinsiyeti olmayan giremez", !policyAllowsGender("women_only", null));
check("kadınlar: undefined giremez", !policyAllowsGender("women_only", undefined));
check("erkekler: erkek girer", policyAllowsGender("men_only", "male"));
check("erkekler: kadın giremez", !policyAllowsGender("men_only", "female"));
check("erkekler: cinsiyeti olmayan giremez", !policyAllowsGender("men_only", null));

// Sürücü seçenekleri
check("kadın sürücü: karma ve kadınlar", policyOptionsFor("female").join() === "mixed,women_only");
check("erkek sürücü: karma ve erkekler", policyOptionsFor("male").join() === "mixed,men_only");
check("cinsiyetsiz sürücü: yalnızca karma", policyOptionsFor(null).join() === "mixed");

// Sürücü mesajları
check("karma: mesaj yok", driverPolicyMessage("mixed", null) === null);
check("kadın sürücü kadınlar açabilir", driverPolicyMessage("women_only", "female") === null);
check("erkek sürücü kadınlar açamaz", (driverPolicyMessage("women_only", "male") ?? "").includes("kadın sürücüler"));
check("kadın sürücü erkekler açamaz", (driverPolicyMessage("men_only", "female") ?? "").includes("erkek sürücüler"));
check("cinsiyetsiz sürücü profile yönlenir", (driverPolicyMessage("men_only", null) ?? "").includes("profilinde"));

// Yolcu mesajları
check("karma: katılma mesajı yok", joinPolicyMessage("mixed", "male") === null);
check("kadın yolcu kadınlar yolculuğuna katılır", joinPolicyMessage("women_only", "female") === null);
check("erkek yolcu kadınlar yolculuğuna katılamaz", (joinPolicyMessage("women_only", "male") ?? "").includes("kadın yolculara"));
check("kadın yolcu erkekler yolculuğuna katılamaz", (joinPolicyMessage("men_only", "female") ?? "").includes("erkek yolculara"));
check("cinsiyetsiz yolcu profile yönlenir", (joinPolicyMessage("women_only", null) ?? "").includes("profilinde"));

// Cinsiyet bir kez belirlenir
check("boşsa ayarlanabilir", genderCanBeSet(null));
check("undefined ayarlanabilir", genderCanBeSet(undefined));
check("belirliyse değiştirilemez", !genderCanBeSet("female"));

console.log(`${passed} test geçti, ${failed} test başarısız`);
process.exit(failed === 0 ? 0 : 1);
