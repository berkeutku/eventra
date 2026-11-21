import { getCurrentUser } from "@/lib/auth";
import { getAvatarBytes } from "@/lib/profile";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Profil fotoğrafı yalnızca giriş yapmış kullanıcılara gösterilir.
// Adres "?v=" ile sürümlendiği için tarayıcı önbelleğinde uzun süre tutulabilir.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const viewer = await getCurrentUser();

  if (!viewer) {
    return new Response(null, { status: 401 });
  }

  const { userId } = await params;

  if (!UUID_PATTERN.test(userId)) {
    return new Response(null, { status: 404 });
  }

  let bytes: Uint8Array | null;

  try {
    bytes = await getAvatarBytes(userId);
  } catch (error) {
    console.error("Fotoğraf okunamadı:", error);
    return new Response(null, { status: 500 });
  }

  if (!bytes) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
