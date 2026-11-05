"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteMessageAction, sendMessageAction } from "@/lib/chat-actions";
import { MAX_MESSAGE, type ChatItem, type ChatPhase } from "@/lib/chat-rules";

const POLL_MS = 8000;
const IDLE_MS = 5 * 60_000;

// Zaman okuma tek yerde: bileşenin çizim kodunda doğrudan Date.now() çağrılmaz.
function nowMs(): number {
  return Date.now();
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

export default function RideChat({
  rideId,
  initialItems,
  phase,
  participantCount,
}: {
  rideId: string;
  initialItems: ChatItem[];
  phase: ChatPhase;
  participantCount: number;
}) {
  const [items, setItems] = useState<ChatItem[]>(initialItems);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [pending, setPending] = useState(false);
  const activity = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  const readOnly = phase === "readonly";

  const touch = useCallback(() => {
    activity.current = nowMs();
  }, []);

  // Sohbet açıldığında "son etkinlik" zamanı başlar.
  useEffect(() => {
    touch();
  }, [touch]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/sohbet?ride=${encodeURIComponent(rideId)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { items?: ChatItem[] };

      if (data.items) {
        setItems(data.items);
      }
    } catch {
      // Bağlantı hatasında bir sonraki yoklamada tekrar denenir.
    }
  }, [rideId]);

  // Sohbet açıkken ve sekme görünürken düzenli yenile. 5 dakika etkinlik yoksa dur (veritabanı uyuyabilsin).
  useEffect(() => {
    if (readOnly || paused) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      if (nowMs() - activity.current > IDLE_MS) {
        setPaused(true);
        return;
      }

      void refresh();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [readOnly, paused, refresh]);

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [items.length]);

  function resume() {
    touch();
    setPaused(false);
    void refresh();
  }

  async function send() {
    const value = text.trim();

    if (!value || pending) {
      return;
    }

    touch();
    setPending(true);
    setNote(null);

    try {
      const result = await sendMessageAction(rideId, value);

      if (result.items) {
        setItems(result.items);
      }

      if (result.ok) {
        setText("");
      } else {
        setNote(result.message ?? "Mesaj gönderilemedi.");
      }
    } catch {
      setNote("Mesaj gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setPending(false);
    }
  }

  async function remove(messageId: string) {
    touch();

    try {
      const result = await deleteMessageAction(rideId, messageId);

      if (result.items) {
        setItems(result.items);
      }
    } catch {
      setNote("Mesaj silinemedi. Lütfen tekrar dene.");
    }
  }

  return (
    <div onClick={touch} onKeyDown={touch}>
      <p className="mt-2 text-sm text-muted">
        Yalnızca bu yolculuğun sürücüsü ve yolcuları görür. Yalnızca ilk adlar
        gösterilir, bağlantı paylaşılamaz. Telefon numarası paylaşmak sana
        kalmış, gerekmedikçe paylaşma. Bir sorun yaşarsan sayfadaki &quot;Bu
        kişiyi bildir&quot; bölümünü kullan. Mesajlar 60 gün sonra silinir.
      </p>

      {participantCount < 2 && (
        <p className="mt-3 rounded-2xl bg-lilac p-3 text-sm text-ink">
          Şimdilik yolculukta yalnızca sürücü var. Yolcu katılınca ona bildirim
          gider.
        </p>
      )}

      <ul
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Yolculuk sohbeti"
        className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-surface p-4"
      >
        {items.length === 0 ? (
          <li className="text-center text-sm text-muted">
            Henüz mesaj yok. İlk mesajı sen yaz.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className={`flex flex-col ${item.mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  item.mine
                    ? "bg-violet text-white"
                    : "bg-white text-ink ring-1 ring-black/5"
                }`}
              >
                {!item.mine && (
                  <p className="mb-0.5 text-xs font-extrabold text-violet">
                    {item.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{item.body}</p>
              </div>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                {timeLabel(item.at)}
                {item.mine && (
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    className="font-bold text-coral-ink hover:underline"
                  >
                    Sil
                  </button>
                )}
              </p>
            </li>
          ))
        )}
      </ul>

      {paused && !readOnly && (
        <p className="mt-3 text-sm text-muted">
          Sohbet bir süredir yenilenmiyor.{" "}
          <button
            type="button"
            onClick={resume}
            className="font-bold text-violet hover:underline"
          >
            Sohbeti yenile
          </button>
        </p>
      )}

      {readOnly ? (
        <p className="mt-4 rounded-2xl bg-surface p-3 text-sm text-muted">
          Etkinlik bitti, bu sohbet artık yalnızca okunabilir.
        </p>
      ) : (
        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="chat-text" className="sr-only">
              Mesajın
            </label>
            <input
              id="chat-text"
              value={text}
              maxLength={MAX_MESSAGE}
              autoComplete="off"
              placeholder="Mesaj yaz…"
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60"
            />
          </div>
          <button
            type="submit"
            disabled={pending || text.trim() === ""}
            className="min-h-12 rounded-full bg-violet px-6 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
          >
            Gönder
          </button>
        </form>
      )}

      {note && (
        <p role="alert" className="mt-3 text-sm font-medium text-coral-ink">
          {note}
        </p>
      )}
    </div>
  );
}