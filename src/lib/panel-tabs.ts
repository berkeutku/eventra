export type PanelSection = "yolculuklar" | "favoriler" | "basarilar" | "ayarlar";

export const SECTION_PATHS: Record<PanelSection, string> = {
  yolculuklar: "/panel/yolculuklar",
  favoriler: "/panel/favoriler",
  basarilar: "/panel/basarilar",
  ayarlar: "/panel/ayarlar",
};

// Eski sekmeli adresleri (/panel?sekme=favoriler) yeni sayfalara yönlendirmek için.
export function legacyTabPath(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !Object.prototype.hasOwnProperty.call(SECTION_PATHS, raw)) {
    return null;
  }

  return SECTION_PATHS[raw as PanelSection];
}