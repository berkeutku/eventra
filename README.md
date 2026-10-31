# Eventra

**Your Event. Your Route.**

Eventra is a ride-sharing web app (installable PWA) that connects people who attended the same event (concert, match, theatre and more) so they can travel home together after it ends.

**Live demo:** https://eventra-one-azure.vercel.app

> **This is a demo, not a commercial product.** There is no real payment, no real ticket provider, no e-Devlet integration and no real map data. Everything that is simulated is labeled "Demo" in the interface. All events, venues and teams are fictional. The user interface is in Turkish; code and technical documentation are in English.


## Features

- **Event discovery:** 24 fictional events in 7 categories (concert, match, theatre, festival, stand-up, university, other) with category filters. Event photos are royalty-free stock images used as representative illustrations, with an illustrated fallback.
- **Accounts and sessions:** email and password sign-up, scrypt password hashing, cookie-based server-side sessions (no external auth library), login attempt throttling, and a safe "return to the page you came from" redirect after login.
- **One account, switchable role:** new accounts start as a passenger. The active role (driver or passenger) can be switched from the dashboard at any time.
- **Create and join rides:** seat capacity, double joining, one-ride-per-event and "drivers cannot join their own ride" rules are enforced on the server inside a database transaction with row locks, and covered by a concurrency test.
- **Fair cost sharing:** the estimated cost per person is `ceil(total / (seats + 1))`, split equally including the driver. No payment is collected.
- **Explainable matching:** rides are ranked with a transparent rule-based score (destination 50, departure time 20, cost 20, seats 10). Every card has a "Why this score?" breakdown. No AI is used.
- **Meeting point suggestions (Demo):** rule-based suggestions (walking 40, crowd 40, lighting 10, access 10) from fictional data, plus a schematic, not-to-scale route summary.
- **Ticket verification (Demo):** simulated provider; code format `EVT-XXX-XXX` plus a check character. Only a SHA-256 digest of the code is stored, and one code can be used by one account.
- **Notifications:** persistent in-app notifications (someone joined or left your ride, a ride you joined was cancelled) with an unread badge and a notifications page. A notification is written in the same database transaction as the action that causes it.
- **Web Push (optional):** per-device subscriptions, delivery claimed in the database so a notification is never sent twice, dead subscriptions are cleaned up, and a device's subscription is removed on logout. It works in production builds over HTTPS; on iPhone it requires the app to be installed to the home screen.
- **Estimated savings and badges:** a dashboard summary computed from your rides, clearly labeled as an estimate, and badges derived from real records at read time (nobody can award themselves a badge).
- **Account deletion:** users can delete their account with password confirmation (wrong passwords count toward the login throttle). Their data is removed in one transaction and affected riders or drivers are notified without naming the deleted user.
- **Passenger privacy:** passenger names are shown only to the ride's driver and to passengers who joined that ride (filtered on the server).
- **PWA:** web app manifest, icons, a service worker that only caches an offline fallback page and static assets (logged-in pages and database data are never cached), and push handling.
- **Social preview:** a link preview image generated at build time.

## Tech stack

- Next.js 16 (App Router, Turbopack), React, TypeScript
- Tailwind CSS v4
- PostgreSQL on Neon (free plan), Drizzle ORM, `pg`, drizzle-kit migrations
- `web-push` for optional push delivery
- Node.js `crypto` (scrypt, SHA-256) for passwords and session tokens
- Deployed on Vercel (Hobby plan)

## Getting started

Requirements: Node.js (LTS), Git, and a PostgreSQL database (a free Neon project works).

```bash
git clone https://github.com/berkeutku/eventra.git
cd eventra
npm install
```

Create a `.env` file in the project root:

```
DATABASE_URL=your-postgres-connection-string

# Optional, only for web push (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=https://your-site.example
```

Never commit `.env`; it is ignored by Git. Then apply the migrations, load the fictional events and start the dev server:

```bash
npx drizzle-kit migrate
npx tsx scripts/seed-events.ts
npm run dev
```

Open http://localhost:3000.

The service worker and web push only work in production builds. To try them locally run `npm run build` and `npm start`.

## Tests

Test scripts live in `scripts/` and are run with `tsx`:

```bash
npx tsx scripts/test-matching.ts            # ride scoring rules
npx tsx scripts/test-meeting-points.ts      # meeting point scoring rules
npx tsx scripts/test-ticket.ts              # demo ticket code format and check character
npx tsx scripts/test-stats.ts               # savings estimate and badge rules
npx tsx scripts/test-safe-redirect.ts       # post-login redirect safety
npx tsx scripts/test-join.ts                # joining rules under concurrent requests (database)
npx tsx scripts/test-throttle.ts            # login attempt throttling (database)
npx tsx scripts/test-notifications.ts       # notification creation and access rules (database)
npx tsx scripts/test-notification-open.ts   # opening a notification, owner only (database)
npx tsx scripts/test-push.ts                # push claiming, cleanup and no double delivery (database, fake sender)
npx tsc --noEmit                            # type check
npm run lint
```

The database tests create temporary users and rides and delete them afterwards. They use the database from your `.env`, so use a development database.

## Security notes

- Passwords are hashed with scrypt; sessions are random tokens whose SHA-256 digest is stored in the database. The cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production, and lasts 7 days.
- Login uses one generic error for wrong email or wrong password, and a dummy hash check for unknown emails.
- Login attempts are limited: 5 failed attempts per email within 15 minutes block further attempts for that email. Expired sessions are deleted when a new session is created.
- Post-login redirects only accept site-internal paths (no open redirect).
- Notifications are always queried by recipient; opening or marking a notification as read only works for its owner.
- Push subscriptions are validated on the server and bound to the signed-in user. Push payloads are encrypted for the receiving device and contain only a title, a text and a site-internal link.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a limited `Content-Security-Policy` (`frame-ancestors`, `base-uri`, `form-action`, `object-src`).

## Known limitations

- No email verification and no password reset.
- Login throttling is per email, not per IP, so someone can temporarily lock out a known email address. Registration is limited per IP (stored only as a hash) and globally per hour.
- The Content-Security-Policy is limited; a full script policy is not set yet.
- Development and the demo deployment may share one database.
- All events, venues, meeting point data and route sketches are fictional demo data.
- Savings figures are estimates under a stated assumption. "Past" rides mean the event date has passed, not that the ride was verified as completed. There is no carbon footprint figure because there is no distance data.
- The unread badge refreshes about once a minute while the page is open (it is not real time).
- Push notification text can include a passenger's name and may appear on a locked screen. Time-based reminders ("your ride starts in one hour") are not implemented.
- There is no real-time chat and no payment.

## Project structure

```
src/app          pages, server actions, API route, manifest, social preview image
src/components   UI components
src/db           database connection and Drizzle schema
src/lib          business rules (auth, rides, matching, meeting points, tickets, notifications, push, stats)
src/data         fictional event data and event photo mapping
scripts          seed script, test scripts, icon and image helper scripts
drizzle          generated SQL migrations
public           icons, logo, event photos, service worker
```
.

## Credits

Event photos are royalty-free stock images used as representative illustrations. All events are fictional.