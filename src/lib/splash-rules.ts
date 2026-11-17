// Açılış görseli kuralları. Veritabanı içermez; hem sunucu hem test betiğinden kullanılır.

export const SPLASH_STORAGE_KEY = "eventra-splash";
export const SPLASH_ATTRIBUTE = "data-splash";
export const SPLASH_DURATION_MS = 3000;

// Sayfa ilk boyanmadan önce çalışır. Bu oturumda açılış görseli daha önce gösterilmediyse
// <html> öğesine işaret koyar ve bir daha gösterilmemesi için oturum kaydına yazar.
// Görselin kendisi saf CSS ile 3 saniyede kendiliğinden kaybolur.
export const SPLASH_INLINE_SCRIPT = `try{if(!sessionStorage.getItem("${SPLASH_STORAGE_KEY}")){document.documentElement.setAttribute("${SPLASH_ATTRIBUTE}","1");sessionStorage.setItem("${SPLASH_STORAGE_KEY}","1")}}catch(e){}`;
