// Saf kurallar: tarayıcıya bağlı değildir, hem bileşenden hem test betiğinden içe aktarılabilir.

export type InstallState = {
  standalone: boolean; // zaten uygulama olarak açılmış
  dismissed: boolean; // kullanıcı kartı kapatmış
  canPrompt: boolean; // tarayıcı tek tıkla kurulum penceresi verebiliyor
  ios: boolean;
};

export type InstallHint = "none" | "prompt" | "ios";

export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

// Hangi kurulum teşviki gösterilsin: tek tıkla kurulum, iPhone yönergesi ya da hiçbiri.
export function installHint(state: InstallState): InstallHint {
  if (state.standalone || state.dismissed) {
    return "none";
  }

  if (state.canPrompt) {
    return "prompt";
  }

  return state.ios ? "ios" : "none";
}
