import {
  SPLASH_ATTRIBUTE,
  SPLASH_DURATION_MS,
  SPLASH_INLINE_SCRIPT,
  SPLASH_STORAGE_KEY,
} from "../src/lib/splash-rules";

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

// Sahte tarayıcı ortamında satır içi betiği çalıştırır.
function run(storage: Map<string, string> | null) {
  const attrs = new Map<string, string>();
  const fakeSession = storage
    ? {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => void storage.set(key, value),
      }
    : {
        getItem: () => {
          throw new Error("erişim yok");
        },
        setItem: () => {
          throw new Error("erişim yok");
        },
      };
  const fakeDocument = {
    documentElement: {
      setAttribute: (name: string, value: string) => void attrs.set(name, value),
    },
  };

  new Function("sessionStorage", "document", SPLASH_INLINE_SCRIPT)(
    fakeSession,
    fakeDocument,
  );

  return attrs;
}

const storage = new Map<string, string>();
const first = run(storage);
check("ilk açılışta işaret konur", first.get(SPLASH_ATTRIBUTE) === "1");
check("ilk açılıştan sonra oturum kaydı yazılır", storage.get(SPLASH_STORAGE_KEY) === "1");

const second = run(storage);
check("aynı oturumda ikinci kez gösterilmez", second.has(SPLASH_ATTRIBUTE) === false);

const blocked = run(null);
check("oturum belleği kapalıysa hata vermez ve göstermez", blocked.has(SPLASH_ATTRIBUTE) === false);

check("süre 3 saniye", SPLASH_DURATION_MS === 3000);
check("anahtar adı boş değil", SPLASH_STORAGE_KEY.length > 0);

console.log(`${passed} test geçti, ${failed} test başarısız`);
process.exit(failed === 0 ? 0 : 1);
