// Sürücü beyanı: yolculuk ilanı verirken her seferinde onaylanır.
// Veritabanı içermez, hem sunucudan hem tarayıcıdan güvenle içe aktarılabilir.

export const DRIVER_DECLARATION_FIELD = "driverDeclaration";

export const DRIVER_DECLARATION_TEXT =
  "Geçerli ehliyetim, aracımın ruhsatı, muayenesi ve zorunlu trafik sigortası var. Bu yolculukta kâr amacı gütmüyorum, yalnızca yol masrafını paylaşıyorum.";

export const DRIVER_DECLARATION_ERROR =
  "Yolculuk oluşturmak için sürücü beyanını onaylamalısın.";

// Onay kutusu işaretliyse tarayıcı "1" gönderir. Başka hiçbir değer onay sayılmaz.
export function isDriverDeclarationAccepted(
  value: FormDataEntryValue | null | undefined,
): boolean {
  return value === "1";
}
