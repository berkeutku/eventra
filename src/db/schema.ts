import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const eventCategory = pgEnum("event_category", [
  "concert",
  "match",
  "theatre", "festival", "standup", "university", "other",
]);

export const userRole = pgEnum("user_role", ["driver", "passenger"]);

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: eventCategory("category").notNull(),
  city: text("city").notNull(),
  venue: text("venue").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  description: text("description").notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("passenger"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rides = pgTable(
  "rides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    meetingPoint: text("meeting_point").notNull(),
    departureTime: time("departure_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    seats: integer("seats").notNull(),
    totalCost: integer("total_cost").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("rides_event_id_idx").on(table.eventId),
    index("rides_driver_id_idx").on(table.driverId),
    check("rides_seats_check", sql`${table.seats} between 1 and 6`),
    check(
      "rides_duration_check",
      sql`${table.durationMinutes} between 5 and 600`,
    ),
    check("rides_cost_check", sql`${table.totalCost} between 0 and 5000`),
  ],
);

export const ridePassengers = pgTable(
  "ride_passengers",
  {
    rideId: uuid("ride_id")
      .notNull()
      .references(() => rides.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.rideId, table.userId] })],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

// DEMO: Gerçek bir bilet sağlayıcısı yoktur. Yalnızca simüle edilen
// doğrulamanın sonucunu ve kodun özetini (hash) saklarız, kodun kendisini değil.
export const ticketVerifications = pgTable(
  "ticket_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull().unique(),
    verifiedAt: timestamp("verified_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("ticket_verifications_user_event_unique").on(
      table.userId,
      table.eventId,
    ),
    index("ticket_verifications_event_id_idx").on(table.eventId),
  ],
);


// Hatalı giriş denemeleri: giriş deneme sınırı için kullanılır.
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("login_attempts_email_time_idx").on(table.email, table.attemptedAt),
  ],
);

export const notificationType = pgEnum("notification_type", [
  "ride_joined",
  "ride_left",
  "ride_cancelled",
]);

// Uygulama içi bildirimler. Her bildirimin tek bir alıcısı vardır.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    // Yalnızca site içi yol (sunucuda üretilir), örn. /events/ornek-etkinlik
    link: text("link").notNull(),
    // Aynı olay için mükerrer bildirimi önlemek için isteğe bağlı anahtar.
    dedupeKey: text("dedupe_key"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    unique("notifications_user_dedupe_unique").on(
      table.userId,
      table.dedupeKey,
    ),
  ],
);


// Telefon ve tarayıcı push abonelikleri. Her cihaz uç noktası (endpoint) benzersizdir.
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("push_subscriptions_user_idx").on(table.userId)],
);

// Hangi bildirimin push için "alındığını" tutar. Aynı bildirimin iki kez gönderilmesini engeller.
export const pushDeliveries = pgTable("push_deliveries", {
  notificationId: uuid("notification_id")
    .primaryKey()
    .references(() => notifications.id, { onDelete: "cascade" }),
  claimedAt: timestamp("claimed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});