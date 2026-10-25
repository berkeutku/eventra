"use client";

import { useEffect, useRef, type RefObject } from "react";

type Point = { x: number; y: number };
type Located = Point & { angle: number };
type Route = { pts: Point[]; cum: number[]; total: number };
type RGB = readonly [number, number, number];

type Dot = {
  g: number;
  car: number;
  seat: number;
  chaosX: number;
  chaosY: number;
  crowdDx: number;
  crowdDy: number;
  phase: number;
  speed: number;
  size: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
  age: number;
};

type Props = {
  story: RefObject<{ progress: number }>;
  phoneRef: RefObject<HTMLDivElement | null>;
};

// Rotaların renkleri ve etiketleri. Fiyatlar telefondaki örnek ekranlarla aynıdır.
const GROUPS: { name: string; price: string; color: RGB }[] = [
  { name: "Kadıköy", price: "150 TL", color: [150, 128, 255] },
  { name: "Beşiktaş", price: "100 TL", color: [255, 107, 107] },
  { name: "Üsküdar", price: "120 TL", color: [0, 213, 160] },
];

// Konumlar, sahnenin genişlik ve yüksekliğine oranla (0 ile 1 arası) verilir.
const GATE: Point = { x: 0.1, y: 0.84 };

const ROUTE_DEFS: { c1: Point; c2: Point; end: Point }[] = [
  { c1: { x: 0.34, y: 0.9 }, c2: { x: 0.8, y: 0.93 }, end: { x: 0.965, y: 0.52 } },
  { c1: { x: 0.4, y: 0.99 }, c2: { x: 0.72, y: 0.97 }, end: { x: 0.93, y: 0.8 } },
  { c1: { x: 0.3, y: 0.82 }, c2: { x: 0.86, y: 0.86 }, end: { x: 0.945, y: 0.24 } },
];

const CARS_PER_ROUTE = 4;
const SEATS = 4;
const CAR_START = 0.03;
const CAR_GAP = 0.045;
const JOIN_AT = 0.86;

const WHITE: RGB = [255, 255, 255];
const LILAC: RGB = [214, 205, 255];
const CONFETTI_COLORS = ["#6c4dff", "#ff6b6b", "#00d5a0", "#ffb547", "#ffffff"];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgba(color: RGB, alpha: number): string {
  return `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${alpha})`;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDots(): Dot[] {
  const random = mulberry32(11);
  const dots: Dot[] = [];

  for (let g = 0; g < GROUPS.length; g++) {
    for (let car = 0; car < CARS_PER_ROUTE; car++) {
      for (let seat = 0; seat < SEATS; seat++) {
        const angle = random() * Math.PI * 2;
        const radius = 14 + Math.sqrt(random()) * 46;

        dots.push({
          g,
          car,
          seat,
          chaosX: random() * 0.52,
          chaosY: 0.32 + random() * 0.68,
          crowdDx: Math.cos(angle) * radius,
          crowdDy: Math.sin(angle) * radius * 0.7,
          phase: random() * Math.PI * 2,
          speed: 0.6 + random() * 1.2,
          size: 2 + random() * 1.2,
        });
      }
    }
  }

  return dots;
}

function buildRoutes(width: number, height: number): Route[] {
  const p0: Point = { x: GATE.x * width, y: GATE.y * height };

  return ROUTE_DEFS.map((def) => {
    const p1: Point = { x: def.c1.x * width, y: def.c1.y * height };
    const p2: Point = { x: def.c2.x * width, y: def.c2.y * height };
    const p3: Point = { x: def.end.x * width, y: def.end.y * height };
    const pts: Point[] = [];
    const cum: number[] = [];
    const steps = 160;
    let total = 0;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const x =
        mt * mt * mt * p0.x +
        3 * mt * mt * t * p1.x +
        3 * mt * t * t * p2.x +
        t * t * t * p3.x;
      const y =
        mt * mt * mt * p0.y +
        3 * mt * mt * t * p1.y +
        3 * mt * t * t * p2.y +
        t * t * t * p3.y;

      if (i > 0) {
        total += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
      }

      pts.push({ x, y });
      cum.push(total);
    }

    return { pts, cum, total };
  });
}

// Rotanın başından itibaren "u" oranı kadar ilerlemiş noktayı ve yönünü bulur.
function locate(route: Route, u: number): Located {
  const target = clamp01(u) * route.total;
  let lo = 0;
  let hi = route.cum.length - 1;

  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (route.cum[mid] <= target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const a = route.pts[lo];
  const b = route.pts[hi];
  const span = route.cum[hi] - route.cum[lo] || 1;
  const f = (target - route.cum[lo]) / span;

  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

function strokeRoute(ctx: CanvasRenderingContext2D, route: Route, u: number) {
  const target = clamp01(u) * route.total;

  ctx.beginPath();
  ctx.moveTo(route.pts[0].x, route.pts[0].y);

  for (let i = 1; i < route.pts.length; i++) {
    if (route.cum[i] <= target) {
      ctx.lineTo(route.pts[i].x, route.pts[i].y);
    } else {
      const end = locate(route, u);
      ctx.lineTo(end.x, end.y);
      break;
    }
  }

  ctx.stroke();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  q: number,
) {
  const diagonal = Math.hypot(width, height);
  const gap = 96;
  const shift = (q * 80) % gap;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.2);
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = -diagonal; x <= diagonal; x += gap) {
    ctx.moveTo(x + shift, -diagonal);
    ctx.lineTo(x + shift, diagonal);
  }

  for (let y = -diagonal; y <= diagonal; y += gap) {
    ctx.moveTo(-diagonal, y);
    ctx.lineTo(diagonal, y);
  }

  ctx.stroke();
  ctx.restore();
}

function drawGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  attention: number,
  t: number,
  animate: boolean,
  family: string,
) {
  ctx.save();
  ctx.translate(x, y);

  if (animate && attention > 0.01) {
    for (let i = 0; i < 2; i++) {
      const phase = (t / 1600 + i * 0.5) % 1;

      ctx.beginPath();
      ctx.arc(0, 0, 24 + phase * 50, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,190,255,${(1 - phase) * 0.5 * attention})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const gradient = ctx.createLinearGradient(-17, -12, 17, 12);
  gradient.addColorStop(0, "#7c5cfc");
  gradient.addColorStop(1, "#22d3ee");

  roundedRect(ctx, -17, -12, 34, 24, 6);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(-17, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(17, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.setLineDash([2.5, 2.5]);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.lineTo(4, 8);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `700 10px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("ÇIKIŞ KAPISI", 0, 30);
  ctx.restore();
}

export default function StoryCanvas({ story, phoneRef }: Props) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const backEl = backRef.current;
    const frontEl = frontRef.current;

    if (!backEl || !frontEl) {
      return;
    }

    const backCtx = backEl.getContext("2d");
    const frontCtx = frontEl.getContext("2d");

    if (!backCtx || !frontCtx) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const dots = buildDots();
    const particles: Particle[] = [];

    let routes: Route[] = [];
    let width = 0;
    let height = 0;
    let family = "sans-serif";
    let q = story.current?.progress ?? 0;
    let last = performance.now();
    let frame = 0;
    let running = false;
    let visible = true;
    let burst = false;

    const resize = () => {
      const rect = backEl.getBoundingClientRect();

      if (rect.width < 2 || rect.height < 2) {
        width = 0;
        height = 0;
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      for (const element of [backEl, frontEl]) {
        element.width = Math.round(width * dpr);
        element.height = Math.round(height * dpr);
      }

      backCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      routes = buildRoutes(width, height);
      family = getComputedStyle(backEl).fontFamily || "sans-serif";
    };

    const spawnConfetti = () => {
      const phone = phoneRef.current?.getBoundingClientRect();

      if (!phone) {
        return;
      }

      const canvasRect = frontEl.getBoundingClientRect();
      const originX = phone.left + phone.width * 0.5 - canvasRect.left;
      const originY = phone.top + phone.height * 0.66 - canvasRect.top;

      for (let i = 0; i < 48; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        const speed = 260 + Math.random() * 380;

        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 12,
          size: 5 + Math.random() * 5,
          color:
            CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          life: 1.3 + Math.random() * 0.7,
          age: 0,
        });
      }
    };

    const carState = (g: number, c: number) => {
      const start = CAR_START + c * CAR_GAP;
      const e = ease(clamp01((q - 0.68 - g * 0.02 - c * 0.01) / 0.22));
      return { u: lerp(start, 0.985, e), e, start };
    };

    const render = (now: number, dt: number) => {
      const W = width;
      const H = height;
      const t = reduced ? 0 : now;
      const gate: Point = { x: GATE.x * W, y: GATE.y * H };

      const gather = ease(clamp01((q - 0.12) / 0.28));
      const sort = ease(clamp01((q - 0.4) / 0.18));
      const board = ease(clamp01((q - 0.58) / 0.1));
      const reveal = ease(clamp01((q - 0.4) / 0.22));
      const pinIn = ease(clamp01((q - 0.46) / 0.1));
      const carIn = ease(clamp01((q - 0.56) / 0.08));

      backCtx.clearRect(0, 0, W, H);
      frontCtx.clearRect(0, 0, W, H);

      drawGrid(backCtx, W, H, q);

      // Rotalar: noktalı çizgi ve arabaların arkasındaki parlayan iz
      routes.forEach((route, g) => {
        const color = GROUPS[g].color;

        backCtx.save();
        backCtx.lineCap = "round";
        backCtx.lineJoin = "round";

        if (reveal > 0.001) {
          backCtx.setLineDash([0.1, 11]);
          backCtx.lineWidth = 3.2;
          backCtx.strokeStyle = rgba(color, 0.42);
          strokeRoute(backCtx, route, reveal);
        }

        let leadU = 0;
        let leadE = 0;

        for (let c = 0; c < CARS_PER_ROUTE; c++) {
          const state = carState(g, c);
          leadU = Math.max(leadU, state.u);
          leadE = Math.max(leadE, state.e);
        }

        if (leadE > 0.002) {
          backCtx.setLineDash([]);
          backCtx.lineWidth = 3;
          backCtx.strokeStyle = rgba(color, 0.85 * clamp01(leadE * 10));
          backCtx.shadowColor = rgba(color, 0.9);
          backCtx.shadowBlur = 12;
          strokeRoute(backCtx, route, leadU);
        }

        backCtx.restore();
      });

      drawGate(
        backCtx,
        gate.x,
        gate.y,
        gather * (1 - sort),
        t,
        !reduced,
        family,
      );

      // Kalabalık: dağınık, toplanmış, yönlere ayrılmış, arabalara binen noktalar
      for (const dot of dots) {
        const route = routes[dot.g];
        const group = GROUPS[dot.g];

        const slot = locate(
          route,
          0.02 + (dot.car * SEATS + dot.seat) * 0.0065,
        );
        const side = dot.seat % 2 === 0 ? -6 : 6;
        const slotPos: Point = {
          x: slot.x - Math.sin(slot.angle) * side,
          y: slot.y + Math.cos(slot.angle) * side,
        };
        const carStart = locate(route, CAR_START + dot.car * CAR_GAP);

        const amplitude = (1 - sort) * lerp(7, 2.5, gather);
        const jx = reduced
          ? 0
          : Math.sin(t * 0.001 * dot.speed + dot.phase) * amplitude;
        const jy = reduced
          ? 0
          : Math.cos(t * 0.0013 * dot.speed + dot.phase * 1.3) * amplitude;

        const chaos: Point = { x: dot.chaosX * W + jx, y: dot.chaosY * H + jy };
        const crowd: Point = {
          x: gate.x + dot.crowdDx + jx * 0.5,
          y: gate.y + dot.crowdDy + jy * 0.5,
        };

        const afterGather = lerpPoint(chaos, crowd, gather);
        const afterSort = lerpPoint(afterGather, slotPos, sort);
        const position = lerpPoint(afterSort, carStart, board);

        const alpha = (0.55 + 0.35 * gather) * (1 - board);

        if (alpha < 0.01) {
          continue;
        }

        const color = mix(mix(WHITE, LILAC, gather), group.color, sort);
        const size = dot.size + gather * 0.8 + sort * 0.4;

        backCtx.beginPath();
        backCtx.arc(position.x, position.y, size * 2.6, 0, Math.PI * 2);
        backCtx.fillStyle = rgba(color, alpha * 0.16);
        backCtx.fill();

        backCtx.beginPath();
        backCtx.arc(position.x, position.y, size, 0, Math.PI * 2);
        backCtx.fillStyle = rgba(color, alpha);
        backCtx.fill();
      }

      // Arabalar
      routes.forEach((route, g) => {
        const color = GROUPS[g].color;

        for (let c = 0; c < CARS_PER_ROUTE; c++) {
          const state = carState(g, c);
          const fade = 1 - ease(clamp01((state.e - 0.95) / 0.05));
          const alpha = carIn * fade;

          if (alpha < 0.02) {
            continue;
          }

          const pos = locate(route, state.u);

          backCtx.save();
          backCtx.translate(pos.x, pos.y);
          backCtx.rotate(pos.angle);
          backCtx.globalAlpha = alpha;
          backCtx.shadowColor = rgba(color, 0.9);
          backCtx.shadowBlur = 16;
          backCtx.fillStyle = rgba(color, 1);
          roundedRect(backCtx, -14, -7.5, 28, 15, 5);
          backCtx.fill();
          backCtx.shadowBlur = 0;
          backCtx.fillStyle = "rgba(255,255,255,0.9)";
          roundedRect(backCtx, 2, -5.5, 8, 11, 2.5);
          backCtx.fill();
          backCtx.fillStyle = "rgba(15,16,32,0.35)";
          roundedRect(backCtx, -9, -5, 9, 10, 2);
          backCtx.fill();
          backCtx.restore();
        }
      });

      // Ön katman: konum işaretleri ve etiketler
      if (pinIn > 0.01) {
        routes.forEach((route, g) => {
          const group = GROUPS[g];
          const end = route.pts[route.pts.length - 1];
          const arrive = ease(clamp01((q - (0.93 + g * 0.02)) / 0.04));

          frontCtx.save();
          frontCtx.globalAlpha = pinIn;

          if (!reduced && arrive > 0.01) {
            const phase = (t / 1100 + g * 0.33) % 1;

            frontCtx.beginPath();
            frontCtx.arc(end.x, end.y, 9 + phase * 22, 0, Math.PI * 2);
            frontCtx.strokeStyle = rgba(group.color, (1 - phase) * 0.6 * arrive);
            frontCtx.lineWidth = 2;
            frontCtx.stroke();
          }

          frontCtx.beginPath();
          frontCtx.arc(end.x, end.y, 8, 0, Math.PI * 2);
          frontCtx.fillStyle = rgba(group.color, 1);
          frontCtx.fill();
          frontCtx.lineWidth = 3;
          frontCtx.strokeStyle = "rgba(255,255,255,0.95)";
          frontCtx.stroke();

          const label =
            arrive > 0.5 ? `${group.name} · ${group.price}` : group.name;

          frontCtx.font = `700 13px ${family}`;
          const textWidth = frontCtx.measureText(label).width;
          const chipWidth = textWidth + 30;
          const chipHeight = 28;
          const chipX = end.x - 20 - chipWidth;
          const chipY = end.y - chipHeight / 2;

          roundedRect(frontCtx, chipX, chipY, chipWidth, chipHeight, 14);
          frontCtx.fillStyle = "rgba(255,255,255,0.96)";
          frontCtx.fill();

          frontCtx.beginPath();
          frontCtx.arc(chipX + 13, end.y, 4, 0, Math.PI * 2);
          frontCtx.fillStyle = rgba(group.color, 1);
          frontCtx.fill();

          frontCtx.textAlign = "left";
          frontCtx.textBaseline = "middle";
          frontCtx.fillStyle = "#101020";
          frontCtx.fillText(label, chipX + 22, end.y + 0.5);
          frontCtx.restore();
        });
      }

      // Konfeti
      if (!reduced) {
        if (q >= JOIN_AT && !burst) {
          burst = true;
          spawnConfetti();
        } else if (q < JOIN_AT - 0.05) {
          burst = false;
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.age += dt;

          if (p.age >= p.life) {
            particles.splice(i, 1);
            continue;
          }

          p.vy += 900 * dt;
          p.vx *= 0.992;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;

          const fade = 1 - clamp01((p.age - p.life * 0.6) / (p.life * 0.4));

          frontCtx.save();
          frontCtx.translate(p.x, p.y);
          frontCtx.rotate(p.rot);
          frontCtx.globalAlpha = fade;
          frontCtx.fillStyle = p.color;
          frontCtx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
          frontCtx.restore();
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;

      if (!running) {
        return;
      }

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const target = story.current?.progress ?? 0;

      if (reduced) {
        q = target;
      } else {
        q += (target - q) * (1 - Math.exp(-dt * 8));

        if (Math.abs(target - q) < 0.0005) {
          q = target;
        }
      }

      if (width > 0) {
        render(now, dt);
      }

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !visible || document.hidden) {
        return;
      }

      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;

      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);

      if (visible) {
        start();
      } else {
        stop();
      }
    });

    const resizing = new ResizeObserver(() => {
      resize();
      start();
    });

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    intersection.observe(backEl);
    resizing.observe(backEl);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    start();

    return () => {
      stop();
      intersection.disconnect();
      resizing.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [story, phoneRef]);

  return (
    <>
      <canvas
        ref={backRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      />
      <canvas
        ref={frontRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full lg:block"
      />
    </>
  );
}