"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { useToast } from "@/components/Toast";
import {
  removeAvatarAction,
  uploadAvatarAction,
} from "@/app/panel/profil-actions";
import {
  AVATAR_FIELD,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_INPUT_BYTES,
  AVATAR_SIZE,
} from "@/lib/profile-rules";

// Seçilen fotoğrafı ortadan kare keser, 320x320 JPEG'e küçültür ve öyle yükler.
// Böylece telefon fotoğrafları (birkaç MB) yüzlerce KB yerine ~30 KB olur.
async function toAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("canvas_unavailable");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();

  for (const quality of [0.86, 0.72, 0.58]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );

    if (blob && blob.size <= AVATAR_MAX_BYTES) {
      return blob;
    }
  }

  throw new Error("too_large");
}

export default function AvatarUploader({
  userId,
  name,
  version,
}: {
  userId: string;
  name: string;
  version: number | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir fotoğraf seç.");
      return;
    }

    if (file.size > AVATAR_MAX_INPUT_BYTES) {
      setError("Bu dosya çok büyük. 12 MB'tan küçük bir fotoğraf seç.");
      return;
    }

    setBusy(true);

    try {
      const blob = await toAvatarBlob(file);
      const data = new FormData();
      data.set(AVATAR_FIELD, new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      const result = await uploadAvatarAction(data);

      if (!result.ok) {
        setError(result.message ?? "Fotoğraf yüklenemedi.");
        return;
      }

      setPreview(URL.createObjectURL(blob));
      toast.show("Profil fotoğrafın güncellendi.");
      router.refresh();
    } catch {
      setError("Bu fotoğraf okunamadı. JPEG ya da PNG bir fotoğraf dene.");
    } finally {
      setBusy(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);

    try {
      const result = await removeAvatarAction();

      if (!result.ok) {
        setError(result.message ?? "Fotoğraf silinemedi.");
        return;
      }

      setPreview(null);
      toast.show("Profil fotoğrafın kaldırıldı.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const hasPhoto = Boolean(preview) || Boolean(version);

  return (
    <div className="flex flex-wrap items-center gap-5">
      {preview ? (
        // Yükleme sonrası sunucudan yenilenene kadar küçültülmüş yerel kopya gösterilir.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-white shadow-soft" />
      ) : (
        <Avatar
          userId={userId}
          name={name}
          version={version}
          size={96}
          className="ring-4 ring-white shadow-soft"
        />
      )}

      <div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Yükleniyor…" : hasPhoto ? "Fotoğrafı değiştir" : "Fotoğraf ekle"}
          </button>
          {hasPhoto ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac disabled:opacity-60"
            >
              Kaldır
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted">
          Kare olarak kırpılır. Yalnızca giriş yapmış kullanıcılar görür. Kendi
          fotoğrafını kullan.
        </p>
        {error ? (
          <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
            {error}
          </p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
