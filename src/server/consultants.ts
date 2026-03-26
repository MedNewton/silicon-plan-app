// src/server/consultants.ts
import { getSupabaseClient } from "@/lib/supabaseServer";
import type {
  Consultant,
  ConsultantSkill,
  ConsultantAvailabilityStatus,
  ServicePackage,
  ConsultantAvailability,
  ConsultantReview,
  Booking,
} from "@/types/workspaces";

// ── List consultants (with first 3 skills per consultant) ──

export type ConsultantListItem = Consultant & {
  skills: string[];
  totalSkills: number;
};

export async function listConsultants(params?: {
  search?: string;
  industry?: string;
  country?: string;
  availability?: string;
  minRate?: number;
  maxRate?: number;
}): Promise<ConsultantListItem[]> {
  const client = getSupabaseClient();

  let query = client.from("consultants").select("*").order("created_at", { ascending: false });

  if (params?.search) {
    const s = `%${params.search}%`;
    query = query.or(`name.ilike.${s},title.ilike.${s}`);
  }
  if (params?.industry) {
    query = query.eq("industry", params.industry as string & {});
  }
  if (params?.country) {
    query = query.eq("country", params.country as string & {});
  }
  if (params?.availability) {
    query = query.eq("availability", params.availability as ConsultantAvailabilityStatus);
  }
  if (params?.minRate != null) {
    query = query.gte("hourly_rate", params.minRate);
  }
  if (params?.maxRate != null) {
    query = query.lte("hourly_rate", params.maxRate);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list consultants: ${error.message}`);

  const consultants = (data ?? []) as Consultant[];
  const consultantIds = consultants.map((c) => c.id);
  if (consultantIds.length === 0) return [];

  const { data: skillsData, error: skillsErr } = await client
    .from("consultant_skills")
    .select("*")
    .in("consultant_id", consultantIds)
    .order("order_index", { ascending: true });

  if (skillsErr) throw new Error(`Failed to load skills: ${skillsErr.message}`);

  const skills = (skillsData ?? []) as ConsultantSkill[];
  const skillsByConsultant = new Map<string, ConsultantSkill[]>();
  for (const skill of skills) {
    const list = skillsByConsultant.get(skill.consultant_id) ?? [];
    list.push(skill);
    skillsByConsultant.set(skill.consultant_id, list);
  }

  return consultants.map((c) => {
    const allSkills = skillsByConsultant.get(c.id) ?? [];
    return {
      ...c,
      skills: allSkills.slice(0, 3).map((s) => s.skill_name),
      totalSkills: allSkills.length,
    };
  });
}

// ── Get consultant detail ──

export type ConsultantDetail = Consultant & {
  skillSections: { title: string; skills: string[] }[];
  servicePackages: ServicePackage[];
  reviews: ConsultantReview[];
  availableSlots: ConsultantAvailability[];
};

export async function getConsultantDetail(
  consultantId: string,
): Promise<ConsultantDetail> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("consultants")
    .select("*")
    .eq("id", consultantId)
    .single();

  if (error || !data) throw new Error("Consultant not found");
  const consultant = data as Consultant;

  const [skillsRes, packagesRes, reviewsRes, availabilityRes] =
    await Promise.all([
      client
        .from("consultant_skills")
        .select("*")
        .eq("consultant_id", consultantId)
        .order("order_index", { ascending: true }),
      client
        .from("service_packages")
        .select("*")
        .eq("consultant_id", consultantId)
        .order("order_index", { ascending: true }),
      client
        .from("consultant_reviews")
        .select("*")
        .eq("consultant_id", consultantId)
        .order("created_at", { ascending: false }),
      client
        .from("consultant_availability")
        .select("*")
        .eq("consultant_id", consultantId)
        .eq("is_booked", false)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

  if (skillsRes.error) throw new Error(`Skills: ${skillsRes.error.message}`);
  if (packagesRes.error) throw new Error(`Packages: ${packagesRes.error.message}`);
  if (reviewsRes.error) throw new Error(`Reviews: ${reviewsRes.error.message}`);
  if (availabilityRes.error) throw new Error(`Availability: ${availabilityRes.error.message}`);

  // Group skills by section
  const rawSkills = (skillsRes.data ?? []) as ConsultantSkill[];
  const sectionMap = new Map<string, string[]>();
  for (const skill of rawSkills) {
    const list = sectionMap.get(skill.section_title) ?? [];
    list.push(skill.skill_name);
    sectionMap.set(skill.section_title, list);
  }
  const skillSections = Array.from(sectionMap.entries()).map(
    ([title, skills]) => ({ title, skills }),
  );

  return {
    ...consultant,
    skillSections,
    servicePackages: (packagesRes.data ?? []) as ServicePackage[],
    reviews: (reviewsRes.data ?? []) as ConsultantReview[],
    availableSlots: (availabilityRes.data ?? []) as ConsultantAvailability[],
  };
}

// ── Similar consultants (same industry, excluding current) ──

export async function getSimilarConsultants(
  consultantId: string,
  limit = 3,
): Promise<Consultant[]> {
  const client = getSupabaseClient();

  const { data: currentData } = await client
    .from("consultants")
    .select("*")
    .eq("id", consultantId)
    .single();

  const current = currentData as Consultant | null;

  // 1. Try same industry first
  if (current?.industry) {
    const { data: sameIndustry } = await client
      .from("consultants")
      .select("*")
      .eq("industry", current.industry as string & {})
      .neq("id", consultantId)
      .limit(limit);

    const results = (sameIndustry ?? []) as Consultant[];
    if (results.length >= limit) return results;

    // 2. Fill remaining slots with other consultants
    const excludeIds = [consultantId, ...results.map((c) => c.id)];
    const remaining = limit - results.length;
    const { data: others } = await client
      .from("consultants")
      .select("*")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("rating", { ascending: false })
      .limit(remaining);

    return [...results, ...((others ?? []) as Consultant[])];
  }

  // No industry — just return top-rated others
  const { data, error } = await client
    .from("consultants")
    .select("*")
    .neq("id", consultantId)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Similar consultants: ${error.message}`);
  return (data ?? []) as Consultant[];
}

// ── Filter options (distinct values from DB) ──

export type ConsultantFilterOptions = {
  industries: string[];
  countries: string[];
  availabilities: string[];
  serviceTypes: string[];
  hourlyRates: { min: number; max: number }[];
};

const RATE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "$0–$50", min: 0, max: 50 },
  { label: "$50–$100", min: 50, max: 100 },
  { label: "$100–$200", min: 100, max: 200 },
  { label: "$200+", min: 200, max: 99999 },
];

export { RATE_BUCKETS };

export async function getConsultantFilterOptions(): Promise<ConsultantFilterOptions> {
  const client = getSupabaseClient();

  const [consultantsRes, packagesRes] = await Promise.all([
    client.from("consultants").select("*"),
    client.from("service_packages").select("*"),
  ]);

  const consultants = (consultantsRes.data ?? []) as Consultant[];
  const packages = (packagesRes.data ?? []) as ServicePackage[];

  const industries = [...new Set(
    consultants.map((c) => c.industry).filter(Boolean) as string[],
  )].sort();

  const countries = [...new Set(
    consultants.map((c) => c.country).filter(Boolean) as string[],
  )].sort();

  const availabilities = [...new Set(
    consultants.map((c) => c.availability),
  )].sort();

  const serviceTypes = [...new Set(
    packages.map((p) => p.name),
  )].sort();

  return {
    industries,
    countries,
    availabilities,
    serviceTypes,
    hourlyRates: RATE_BUCKETS.map(({ min, max }) => ({ min, max })),
  };
}

// ── Check if user can review a consultant ──

export async function canUserReview(
  userId: string,
  consultantId: string,
): Promise<{ allowed: boolean; hasExistingReview: boolean }> {
  const client = getSupabaseClient();

  // Check if user has any booking with this consultant
  const { data: bookingsData } = await client
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .eq("consultant_id", consultantId)
    .limit(1);

  const hasBooking = ((bookingsData ?? []) as Booking[]).length > 0;

  // Check if user already reviewed this consultant
  const { data: reviewData } = await client
    .from("consultant_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("consultant_id", consultantId)
    .limit(1);

  const hasExistingReview = ((reviewData ?? []) as ConsultantReview[]).length > 0;

  return { allowed: hasBooking, hasExistingReview };
}

// ── Submit a review ──

export type CreateReviewParams = {
  userId: string;
  consultantId: string;
  rating: number;
  text: string;
  userName: string;
  userCountry?: string;
};

export async function createReview(params: CreateReviewParams): Promise<ConsultantReview> {
  const client = getSupabaseClient();

  // Verify user has a booking
  const { data: bookingsData } = await client
    .from("bookings")
    .select("*")
    .eq("user_id", params.userId)
    .eq("consultant_id", params.consultantId)
    .limit(1);

  const bookings = (bookingsData ?? []) as Booking[];
  if (bookings.length === 0) {
    throw new Error("You must have a booking with this consultant to leave a review");
  }

  // Check for existing review
  const { data: existingData } = await client
    .from("consultant_reviews")
    .select("*")
    .eq("user_id", params.userId)
    .eq("consultant_id", params.consultantId)
    .limit(1);

  if (((existingData ?? []) as ConsultantReview[]).length > 0) {
    throw new Error("You have already reviewed this consultant");
  }

  // Create review
  const { data, error } = await client
    .from("consultant_reviews")
    .insert({
      consultant_id: params.consultantId,
      user_id: params.userId,
      booking_id: bookings[0]!.id,
      rating: params.rating,
      text: params.text,
      user_name: params.userName,
      user_country: params.userCountry ?? null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Failed to create review: ${error?.message}`);

  // Update consultant rating and review count
  const { data: allReviews } = await client
    .from("consultant_reviews")
    .select("*")
    .eq("consultant_id", params.consultantId);

  const reviews = (allReviews ?? []) as ConsultantReview[];
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await client
    .from("consultants")
    .update({
      rating: Math.round(avgRating * 10) / 10,
      review_count: reviews.length,
    })
    .eq("id", params.consultantId);

  return data as ConsultantReview;
}
