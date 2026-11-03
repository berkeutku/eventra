"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = ["#6c4dff", "#ff6b6b", "#00d5a0", "#ffb547"];

const PIECES = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2;
  const distance = 110 + ((index * 37) % 7) * 26;

  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance) - 50,
    rotate: (index * 53) % 360,
    color: COLORS[index % COLORS.length],
    round: index % 3 === 0,
  };
});

// "joined" değeri false iken true olursa (yani kullanıcı az önce katıldıysa) kısa bir kutlama gösterir.
// Sayfa zaten katılmış durumda açılırsa hiçbir şey göstermez.
export default function JoinCelebration({ joined }: { joined: boolean }) {
  const previous = useRef(joined);
  const [visible, setVisible] = useState(false);
  const [spread, setSpread] = useState(false);

  useEffect(() => {
    const wasJoined = previous.current;
    previous.current = joined;

    if (wasJoined || !joined) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      setSpread(false);
      setVisible(true);
      inner = requestAnimationFrame(() => setSpread(true));
    });
    const hide = window.setTimeout(() => setVisible(false), 2200);

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.clearTimeout(hide);
    };
  }, [joined]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <p role="status" className="sr-only">
        Yolculuğa katıldın.
      </p>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90]"
      >
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white shadow-soft">
          Yolculuğa katıldın!
        </div>
        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {PIECES.map((piece, index) => (
            <span
              key={index}
              className="absolute block"
              style={{
                width: piece.round ? 9 : 14,
                height: piece.round ? 9 : 7,
                marginLeft: piece.round ? -4 : -7,
                marginTop: piece.round ? -4 : -3,
                borderRadius: piece.round ? 999 : 2,
                backgroundColor: piece.color,
                opacity: spread ? 0 : 1,
                transform: spread
                  ? `translate(${piece.dx}px, ${piece.dy}px) rotate(${piece.rotate}deg)`
                  : "translate(0px, 0px) rotate(0deg)",
                transition:
                  "transform 1400ms cubic-bezier(0.15, 0.7, 0.2, 1), opacity 700ms ease-in 900ms",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}