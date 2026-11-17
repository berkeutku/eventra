"use client";

// Kök düzen (layout) çöktüğünde gösterilir. Düzen yüklenmediği için stiller satır içi.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#faf8ff",
          color: "#1b1530",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: 480,
            margin: "96px auto",
            padding: 32,
            textAlign: "center",
            background: "#ffffff",
            borderRadius: 24,
          }}
        >
          <h1 style={{ fontSize: 26, margin: 0 }}>Bir şeyler ters gitti</h1>
          <p style={{ marginTop: 12, color: "#5b5675" }}>
            Eventra şu an açılamadı. Birkaç saniye sonra tekrar dene.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 20,
              minHeight: 44,
              padding: "0 24px",
              border: 0,
              borderRadius: 999,
              background: "#6d4aff",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
          {error.digest ? (
            <p style={{ marginTop: 20, fontSize: 12, color: "#5b5675" }}>
              Destek için hata kodu: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
