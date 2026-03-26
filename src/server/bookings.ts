// src/server/bookings.ts
import { getSupabaseClient } from "@/lib/supabaseServer";
import type {
  Booking,
  Consultant,
} from "@/types/workspaces";

// ── Create booking ──

export type CreateBookingParams = {
  userId: string;
  consultantId: string;
  servicePackageId: string;
  availabilitySlotId: string;
  userComment?: string;
};

export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const client = getSupabaseClient();

  // 1. Load the service package
  const { data: pkgData, error: pkgErr } = await client
    .from("service_packages")
    .select("*")
    .eq("id", params.servicePackageId)
    .single();
  if (pkgErr || !pkgData) throw new Error("Service package not found");

  // 2. Load and lock the availability slot
  const { data: slotData, error: slotErr } = await client
    .from("consultant_availability")
    .select("*")
    .eq("id", params.availabilitySlotId)
    .eq("is_booked", false)
    .single();
  if (slotErr || !slotData) throw new Error("Time slot is no longer available");

  const slot = slotData as { id: string; date: string; start_time: string; end_time: string };
  const pkg = pkgData as { price: number; duration_minutes: number };

  // 3. Mark slot as booked
  const { error: updateErr } = await client
    .from("consultant_availability")
    .update({ is_booked: true })
    .eq("id", params.availabilitySlotId)
    .eq("is_booked", false);
  if (updateErr) throw new Error("Failed to reserve time slot");

  // 4. Create the booking
  const { data: bookingData, error: bookingErr } = await client
    .from("bookings")
    .insert({
      user_id: params.userId,
      consultant_id: params.consultantId,
      service_package_id: params.servicePackageId,
      status: "pending",
      booking_date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: pkg.duration_minutes,
      cost: pkg.price,
      payment_status: "unpaid",
      user_comment: params.userComment ?? "",
    })
    .select("*")
    .single();

  if (bookingErr || !bookingData) throw new Error(`Failed to create booking: ${bookingErr?.message}`);

  // 5. Increment session_count on consultant
  const { data: consultantData } = await client
    .from("consultants")
    .select("session_count")
    .eq("id", params.consultantId)
    .single();
  if (consultantData) {
    const current = (consultantData as { session_count: number }).session_count;
    await client
      .from("consultants")
      .update({ session_count: current + 1 })
      .eq("id", params.consultantId);
  }

  return bookingData as Booking;
}

// ── List user bookings ──

export type BookingWithConsultant = Booking & {
  consultant_name: string;
  company: string;
  service_name: string;
};

export async function listUserBookings(userId: string): Promise<BookingWithConsultant[]> {
  const client = getSupabaseClient();

  const { data: bookingsData, error } = await client
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load bookings: ${error.message}`);

  const bookings = (bookingsData ?? []) as Booking[];
  if (bookings.length === 0) return [];

  // Load consultant and package info
  const consultantIds = [...new Set(bookings.map((b) => b.consultant_id))];
  const packageIds = [...new Set(bookings.map((b) => b.service_package_id))];

  const [consultantsRes, packagesRes] = await Promise.all([
    client.from("consultants").select("*").in("id", consultantIds),
    client.from("service_packages").select("*").in("id", packageIds),
  ]);

  const consultantMap = new Map<string, Consultant>();
  for (const c of ((consultantsRes.data ?? []) as Consultant[])) {
    consultantMap.set(c.id, c);
  }

  const packageMap = new Map<string, { name: string }>();
  for (const p of ((packagesRes.data ?? []) as { id: string; name: string }[])) {
    packageMap.set(p.id, p);
  }

  return bookings.map((b) => {
    const consultant = consultantMap.get(b.consultant_id);
    const pkg = packageMap.get(b.service_package_id);
    return {
      ...b,
      consultant_name: consultant?.name ?? "Unknown",
      company: consultant?.title ?? "",
      service_name: pkg?.name ?? "Consultation",
    };
  });
}

// ── Cancel booking ──

export async function cancelBooking(bookingId: string, userId: string): Promise<void> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new Error("Booking not found");

  const booking = data as Booking;
  if (booking.status === "cancelled") throw new Error("Booking already cancelled");

  await client
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
}
