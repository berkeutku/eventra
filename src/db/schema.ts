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
  uuid,
} from "drizzle-orm/pg-core";

export const eventCategory = pgEnum("event_category", [
  "concert",
  "match",
  "theatre",
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
  role: userRole("role").notNull(),
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