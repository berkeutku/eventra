export type PanelTab =
  | "genel"
  | "yolculuklar"
  | "favoriler"
  | "basarilar"
  | "ayarlar";

export const TAB_ITEMS: { key: PanelTab; label: string }[] = [
  { key: "genel", label: "Genel bakış" },
  { key: "yolculuklar", label: "Yolculuklarım" },
  { key: "favoriler", label: "Favoriler" },
  { key: "basarilar", label: "Başarılar" },
  { key: "ayarlar", label: "Ayarlar" },
];

export function tabHref(tab: PanelTab): string {
  return tab === "genel" ? "/panel" : `/panel?sekme=${tab}`;
}

// Adres çubuğundaki ?sekme= değerini güvenle çözer; geçersizse "genel" döner.
export function parseTab(value: string | string[] | undefined): PanelTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return TAB_ITEMS.find((item) => item.key === raw)?.key ?? "genel";
}