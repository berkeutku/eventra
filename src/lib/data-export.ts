import { count, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  eventFavorites,
  events,
  notificationPreferences,
  notifications,
  pushSubscriptions,
  rideMessages,
  ridePassengers,
  rideRatings,
  rideRequests,
  rideShares,
  rides,
  ticketVerifications,
  userReports,
  users,
} from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.
//
// Kişisel veri erişim hakkı için kullanıcının KENDİ verilerini toplar. Bilerek dışarıda bırakılanlar:
// parola özeti, bilet kodu özeti, bildirim uç noktaları (cihaz anahtarları), paylaşım bağlantısı özetleri
// ve diğer kullanıcıların kimlik bilgileri (ad, e-posta). Puan verenin kimliği de gösterilmez.

const LIMIT = 1000;
const NOTIFICATION_LIMIT = 500;

export async function collectUserData(userId: string) {
  const [
    profile,
    drivenRides,
    joinedRides,
    verifications,
    favorites,
    requests,
    ratingsGiven,
    ratingsReceived,
    messages,
    reports,
    notificationRows,
    preferences,
    pushDevices,
    shares,
  ] = await Promise.all([
    db
      .select({
        name: users.name,
        email: users.email,
        role: users.role,
        gender: users.gender,
        bio: users.bio,
        city: users.city,
        theme: users.theme,
        interests: users.interests,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        id: rides.id,
        eventId: rides.eventId,
        eventTitle: events.title,
        origin: rides.origin,
        destination: rides.destination,
        meetingPoint: rides.meetingPoint,
        departureTime: rides.departureTime,
        durationMinutes: rides.durationMinutes,
        seats: rides.seats,
        totalCost: rides.totalCost,
        vehicle: rides.vehicle,
        genderPolicy: rides.genderPolicy,
        status: rides.status,
        departedAt: rides.departedAt,
        arrivedAt: rides.arrivedAt,
        createdAt: rides.createdAt,
      })
      .from(rides)
      .innerJoin(events, eq(events.id, rides.eventId))
      .where(eq(rides.driverId, userId))
      .orderBy(desc(rides.createdAt))
      .limit(LIMIT),
    db
      .select({
        rideId: rides.id,
        eventId: rides.eventId,
        eventTitle: events.title,
        origin: rides.origin,
        destination: rides.destination,
        meetingPoint: rides.meetingPoint,
        departureTime: rides.departureTime,
        status: rides.status,
        joinedAt: ridePassengers.joinedAt,
      })
      .from(ridePassengers)
      .innerJoin(rides, eq(rides.id, ridePassengers.rideId))
      .innerJoin(events, eq(events.id, rides.eventId))
      .where(eq(ridePassengers.userId, userId))
      .orderBy(desc(ridePassengers.joinedAt))
      .limit(LIMIT),
    db
      .select({
        eventId: ticketVerifications.eventId,
        eventTitle: events.title,
        verifiedAt: ticketVerifications.verifiedAt,
      })
      .from(ticketVerifications)
      .innerJoin(events, eq(events.id, ticketVerifications.eventId))
      .where(eq(ticketVerifications.userId, userId))
      .orderBy(desc(ticketVerifications.verifiedAt))
      .limit(LIMIT),
    db
      .select({
        eventId: eventFavorites.eventId,
        eventTitle: events.title,
        createdAt: eventFavorites.createdAt,
      })
      .from(eventFavorites)
      .innerJoin(events, eq(events.id, eventFavorites.eventId))
      .where(eq(eventFavorites.userId, userId))
      .orderBy(desc(eventFavorites.createdAt))
      .limit(LIMIT),
    db
      .select({
        eventId: rideRequests.eventId,
        eventTitle: events.title,
        destination: rideRequests.destination,
        preferredTime: rideRequests.preferredTime,
        seats: rideRequests.seats,
        note: rideRequests.note,
        createdAt: rideRequests.createdAt,
      })
      .from(rideRequests)
      .innerJoin(events, eq(events.id, rideRequests.eventId))
      .where(eq(rideRequests.passengerId, userId))
      .orderBy(desc(rideRequests.createdAt))
      .limit(LIMIT),
    db
      .select({
        rideId: rideRatings.rideId,
        score: rideRatings.score,
        comment: rideRatings.comment,
        createdAt: rideRatings.createdAt,
      })
      .from(rideRatings)
      .where(eq(rideRatings.raterId, userId))
      .orderBy(desc(rideRatings.createdAt))
      .limit(LIMIT),
    db
      .select({
        rideId: rideRatings.rideId,
        score: rideRatings.score,
        comment: rideRatings.comment,
        createdAt: rideRatings.createdAt,
      })
      .from(rideRatings)
      .where(eq(rideRatings.rateeId, userId))
      .orderBy(desc(rideRatings.createdAt))
      .limit(LIMIT),
    db
      .select({
        rideId: rideMessages.rideId,
        body: rideMessages.body,
        createdAt: rideMessages.createdAt,
      })
      .from(rideMessages)
      .where(eq(rideMessages.senderId, userId))
      .orderBy(desc(rideMessages.createdAt))
      .limit(LIMIT),
    db
      .select({
        rideId: userReports.rideId,
        reason: userReports.reason,
        details: userReports.details,
        status: userReports.status,
        createdAt: userReports.createdAt,
      })
      .from(userReports)
      .where(eq(userReports.reporterId, userId))
      .orderBy(desc(userReports.createdAt))
      .limit(LIMIT),
    db
      .select({
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        link: notifications.link,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(NOTIFICATION_LIMIT),
    db
      .select({ mutedPushTypes: notificationPreferences.mutedPushTypes })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1),
    db
      .select({ total: count() })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId)),
    db
      .select({
        rideId: rideShares.rideId,
        createdAt: rideShares.createdAt,
        expiresAt: rideShares.expiresAt,
      })
      .from(rideShares)
      .where(eq(rideShares.createdBy, userId))
      .orderBy(desc(rideShares.createdAt))
      .limit(LIMIT),
  ]);

  return {
    profil: profile[0] ?? null,
    olusturdugumYolculuklar: drivenRides,
    katildigimYolculuklar: joinedRides,
    biletDogrulamalarim: verifications,
    favorilerim: favorites,
    yolcuTaleplerim: requests,
    verdigimPuanlar: ratingsGiven,
    hakkimdakiPuanlar: ratingsReceived,
    sohbetMesajlarim: messages,
    gonderdigimSikayetler: reports,
    bildirimlerim: notificationRows,
    bildirimTercihim: {
      telefonaGonderilmeyenTurler: preferences[0]?.mutedPushTypes ?? [],
      kayitliCihazSayisi: pushDevices[0]?.total ?? 0,
    },
    olusturdugumPaylasimBaglantilari: shares,
  };
}

export type UserDataExport = Awaited<ReturnType<typeof collectUserData>>;
