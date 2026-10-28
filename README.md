# Eventra

**Your Event. Your Route.**

Eventra is a ride-sharing web app (installable PWA) that connects people who attended the same event (concert, match, theatre) so they can travel home together after it ends.

> **This is a portfolio demo, not a commercial product.** There is no real payment, no real ticket provider, no e-Devlet integration and no real map data. Everything that is simulated is labeled "Demo" in the interface. All events, venues and teams are fictional. The user interface is in Turkish; code and technical documentation are in English.

## Features

- **Event-based rides:** every ride belongs to one event; riders only plan with people going to the same event.
- **Accounts and sessions:** email and password sign-up, scrypt password hashing, cookie-based server-side sessions (no external auth library).
- **One account, switchable role:** new accounts start as a passenger. The active role (driver or passenger) can be switched from the dashboard at any time.
- **Create and join rides:** drivers create rides; passengers join them. Seat capacity, double joining, one-ride-per-event and "drivers cannot join their own ride" rules are enforced on the server inside a database transaction with row locks.
- **Fair cost sharing:** the estimated cost per person is `ceil(total / (seats + 1))`, split equally including the driver. No payment is collected.
- **Explainable matching:** rides are ranked with a transparent rule-based score (destination 50, departure time 20, cost 20, seats 10). Every card has a "Why this score?" breakdown. No AI is used.
- **Meeting point suggestions (Demo):** rule-based suggestions (walking 40, crowd 40, lighting 10, access 10) from fictional data, plus a schematic, not-to-scale route summary.
- **Ticket verification (Demo):** simulated provider; code format `EVT-XXX-XXX` plus a check character. Only a SHA-256 digest of the code is stored, and one code can be used by one account.
- **Passenger privacy:** passenger names are shown only to the ride's driver and to passengers who joined that ride (filtered on the server).
- **PWA:** web app manifest, icons, and a service worker that only caches an offline fallback page and static assets. Logged-in pages and database data are never cached.

## Tech stack

- Next.js 16 (App Router, Turbopack), React, TypeScript
- Tailwind CSS v4
- PostgreSQL on Neon (free plan), Drizzle ORM, `pg`, drizzle-kit migrations
- Node.js `crypto` (scrypt, SHA-256) for passwords and session tokens
- Plus Jakarta Sans and Caveat via `next/font/google`

## Getting started

Requirements: Node.js (LTS), Git, and a PostgreSQL database (a free Neon project works).

```bash
git clone https://github.com/berkeutku/eventra.git
cd eventra
npm install
```

Create a `.env` file in the project root with a single variable: