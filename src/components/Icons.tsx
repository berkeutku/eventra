import type { ReactNode } from "react";
import type { EventCategory } from "@/data/events";

const paths = {
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 9V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a3 3 0 0 0 0 6v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a3 3 0 0 0 0-6z" />
      <path d="M14 6v12" strokeDasharray="2 3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h5.5a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7H16" />
    </>
  ),
  car: (
    <>
      <path d="M4 15v-2.5l1.7-4.3A2 2 0 0 1 7.6 7h8.8a2 2 0 0 1 1.9 1.2L20 12.5V15" />
      <rect x="3" y="15" width="18" height="4" rx="1.5" />
      <circle cx="7.5" cy="17" r=".7" fill="currentColor" />
      <circle cx="16.5" cy="17" r=".7" fill="currentColor" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14.5a5.5 5.5 0 0 1 4.5 5.5" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h12v3" />
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M16 13.5h2.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="3" />
      <path d="M4 11h16M8 17v3M16 17v3" />
      <circle cx="8" cy="14" r=".7" fill="currentColor" />
      <circle cx="16" cy="14" r=".7" fill="currentColor" />
    </>
  ),
  parking: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" />
    </>
  ),
  map: (
    <>
      <path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 8.3 3.3 2.4-1.3 3.9h-4l-1.3-3.9z" />
      <path d="M12 3v5.3M20.4 9.2l-5.1 1.5M17.3 19.2 14 14.6M6.7 19.2 10 14.6M3.6 9.2l5.1 1.5" />
    </>
  ),
  mask: (
    <>
      <path d="M4 5c3 1.5 13 1.5 16 0v7a8 8 0 0 1-16 0z" />
      <path d="M8.5 10h.01M15.5 10h.01" />
      <path d="M9 15c1.5 1.5 4.5 1.5 6 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />, mic: (<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>), cap: (<><path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" /><path d="M6.5 11.5V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.5M21.5 9v5" /></>), spark: (<><path d="M12 4v4M12 16v4M4 12h4M16 12h4" /><path d="m7 7 2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" /></>), bell: (<><path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" /></>), arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export const categoryIcon: Record<EventCategory, IconName> = {
  concert: "music",
  match: "ball",
  theatre: "mask", festival: "star", standup: "mic", university: "cap", other: "spark",
};

export default function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}