/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Eventra: Your Event. Your Route.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Logo = { src: string; width: number; height: number };

// Logo dosyasını okur ve en-boy oranını PNG başlığından alır. Başarısız olursa null döner.
async function loadLogo(height: number): Promise<Logo | null> {
  try {
    const file = await readFile(
      path.join(process.cwd(), "public", "logo-mark.png"),
    );

    if (file.length > 4_000_000) {
      return null;
    }

    const naturalWidth = file.readUInt32BE(16);
    const naturalHeight = file.readUInt32BE(20);

    if (!naturalWidth || !naturalHeight) {
      return null;
    }

    return {
      src: `data:image/png;base64,${file.toString("base64")}`,
      width: Math.round((naturalWidth / naturalHeight) * height),
      height,
    };
  } catch {
    return null;
  }
}

const chips = ["Next.js", "TypeScript", "PostgreSQL", "PWA"];

export default async function OpengraphImage() {
  const logo = await loadLogo(120);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 80px",
          color: "#ffffff",
          backgroundImage:
            "linear-gradient(135deg, #0f1020 0%, #1b1450 60%, #6c4dff 140%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {logo ? (
            <img
              src={logo.src}
              width={logo.width}
              height={logo.height}
              alt=""
              style={{ marginRight: 28 }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: 112,
              fontWeight: 700,
              letterSpacing: -3,
            }}
          >
            eventra
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              color: "#ff8f8f",
            }}
          >
            Your Event. Your Route.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 36,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            Ride sharing for people leaving the same concert, match or show.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                marginRight: 16,
                padding: "10px 24px",
                fontSize: 28,
                fontWeight: 700,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            >
              {chip}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Demo
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}