// src/components/consultants/ConsultantDetailContent.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Skeleton,
  TextField,
  IconButton,
  Dialog,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/* ── types ── */

type SkillSection = {
  title: string;
  skills: string[];
};

type ApiServicePackage = {
  id: string;
  name: string;
  price: number;
  description: string;
  consultation_content: string;
  duration_minutes: number;
};

type AvailabilitySlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
};

type Review = {
  id: string;
  user_name: string;
  user_country: string | null;
  rating: number;
  text: string;
};

type SimilarConsultant = {
  id: string;
  name: string;
  title: string;
  description: string;
  hourly_rate: number;
  rating: number;
  review_count: number;
  session_count: number;
  avatar_url: string | null;
};

type ConsultantDetailData = {
  id: string;
  name: string;
  title: string;
  description: string;
  rating: number;
  review_count: number;
  session_count: number;
  avatar_url: string | null;
  video_url: string | null;
  skillSections: SkillSection[];
  servicePackages: ApiServicePackage[];
  reviews: Review[];
  availableSlots: AvailabilitySlot[];
  similarConsultants: SimilarConsultant[];
};

/* ── helpers ── */

function formatDayFromDate(dateStr: string): { dayOfWeek: string; month: string; day: number } {
  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return { dayOfWeek, month, day };
}

/* ── component ── */

type Props = {
  consultantId: string;
  onBack: () => void;
  onNavigateToBookings?: () => void;
};

export default function ConsultantDetailContent({ consultantId, onBack, onNavigateToBookings }: Props) {
  const { t } = useLanguage();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [detail, setDetail] = useState<ConsultantDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/consultants/${consultantId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = (await res.json()) as ConsultantDetailData;
        setDetail(data);
      } catch (err) {
        console.error("Failed to load consultant detail", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [consultantId]);

  if (loading || !detail) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F7F8FC" }}>
        <CircularProgress size={40} sx={{ color: "#3B5998" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#F7F8FC",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      {/* Back button */}
      <Box sx={{ px: 4, pt: 2, pb: 1 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
          onClick={onBack}
          sx={{
            textTransform: "none",
            color: "#1E2B42",
            fontWeight: 500,
            fontSize: 14,
            borderRadius: 50,
            border: "1px solid #D5DAE1",
            bgcolor: "#fff",
            px: 2.5,
            py: 0.8,
            "&:hover": { bgcolor: "#F8FAFC", borderColor: "#B0B8C4" },
          }}
        >
          {t("consultants.backToConsultants")}
        </Button>
      </Box>

      {/* Main layout: left content + right sidebar */}
      <Box sx={{ display: "flex", gap: 3, px: 4, pt: 1, pb: 4, width: "100%" }}>
        {/* Left column */}
        <Box sx={{ flex: 7, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Profile card */}
          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 3,
              p: 3,
            }}
          >
            {/* Header row */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {detail.avatar_url ? (
                <Box component="img" src={detail.avatar_url} alt={detail.name} sx={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <Skeleton variant="circular" width={52} height={52} sx={{ flexShrink: 0 }} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
                  {detail.name}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                  {detail.title}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <StarIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {detail.rating}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  ({detail.review_count})
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {t("consultants.sessions", { count: String(detail.session_count) })}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  borderColor: "#E2E8F0",
                  color: "#1E2B42",
                  fontWeight: 500,
                  fontSize: 13,
                  px: 3,
                  "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                }}
              >
                {t("consultants.message")}
              </Button>
            </Box>

            {/* Description */}
            <Typography
              sx={{ fontSize: 13.5, color: "text.secondary", lineHeight: 1.7 }}
            >
              {detail.description}
            </Typography>
          </Box>

          {/* Skill sections */}
          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 3,
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            {detail.skillSections.map((section) => (
              <Box key={section.title}>
                <Typography
                  sx={{ fontSize: 15, fontWeight: 700, color: "#1E2B42", mb: 1 }}
                >
                  {section.title}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {section.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: "#E2E8F0",
                        fontSize: 12,
                        height: 28,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>

          {/* Client feedbacks */}
          <Box>
            <Typography
              sx={{ fontSize: 20, fontWeight: 700, color: "#1E2B42", mb: 2 }}
            >
              {t("consultants.clientsFeedbacks")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              {detail.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </Box>
          </Box>

          {/* Similar consultants */}
          <Box>
            <Typography
              sx={{ fontSize: 20, fontWeight: 700, color: "#1E2B42", mb: 2 }}
            >
              {t("consultants.similarConsultants")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
              }}
            >
              {detail.similarConsultants.map((sc) => (
                <SimilarConsultantCard key={sc.id} consultant={sc} />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right column */}
        <Box
          sx={{
            flex: 3,
            width: 0,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            position: "sticky",
            top: 16,
            alignSelf: "flex-start",
          }}
        >
          {/* How I can help you */}
          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Typography
              sx={{ fontSize: 18, fontWeight: 700, color: "#1E2B42", px: 3, pt: 3, pb: 1.5 }}
            >
              {t("consultants.howCanHelp")}
            </Typography>
            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: 2,
                mb: 2,
                borderRadius: 2,
                overflow: "hidden",
                minHeight: 180,
              }}
            >
              {detail.video_url ? (
                <Box
                  component="video"
                  src={detail.video_url}
                  sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Skeleton
                  variant="rectangular"
                  sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                />
              )}
              <PlayCircleIcon
                sx={{
                  fontSize: 48,
                  color: "rgba(255,255,255,0.7)",
                  position: "relative",
                  zIndex: 1,
                  cursor: "pointer",
                }}
              />
            </Box>
          </Box>

          {/* Service packages */}
          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 3,
              p: 3,
              maxWidth: "100%",
            }}
          >
            <Typography
              sx={{ fontSize: 18, fontWeight: 700, color: "#1E2B42", mb: 2 }}
            >
              {t("consultants.servicePackages")}
            </Typography>
            <Stack spacing={1.5}>
              {detail.servicePackages.map((pkg) => (
                <ServicePackageAccordion
                  key={pkg.id}
                  pkg={pkg}
                  consultantId={detail.id}
                  availableSlots={detail.availableSlots}
                  isExpanded={expandedPkgId === pkg.id}
                  onToggle={() => setExpandedPkgId(expandedPkgId === pkg.id ? null : pkg.id)}
                  onBook={() => setShowBookingModal(true)}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Booking confirmation modal */}
      <Dialog
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 5,
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {detail.avatar_url ? (
            <Box component="img" src={detail.avatar_url} alt={detail.name} sx={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <Skeleton variant="circular" width={90} height={90} />
          )}
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1E2B42" }}>
              {detail.name}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              {detail.title}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#2E9E5A", mt: 1 }}>
            {t("consultants.bookedSuccess")}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.6 }}>
            {t("consultants.bookedSubtext")}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => { setShowBookingModal(false); onNavigateToBookings?.(); }}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              bgcolor: "#3B5998",
              fontWeight: 600,
              fontSize: 15,
              py: 1.5,
              mt: 1,
              "&:hover": { bgcolor: "#2D4A7A" },
            }}
          >
            {t("consultants.myBookings")}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

/* ── sub-components ── */

type AccordionView = "collapsed" | "details" | "booking";

function ServicePackageAccordion({ pkg, consultantId, availableSlots, isExpanded, onToggle, onBook }: { pkg: ApiServicePackage; consultantId: string; availableSlots: AvailabilitySlot[]; isExpanded: boolean; onToggle: () => void; onBook: () => void }) {
  const { t } = useLanguage();
  const [view, setView] = useState<AccordionView>("collapsed");

  // Reset when another accordion opens
  useEffect(() => {
    if (!isExpanded) {
      setView("collapsed");
    }
  }, [isExpanded]);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [requestText, setRequestText] = useState("");
  const [booking, setBooking] = useState(false);
  const daysRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -150 : 150, behavior: "smooth" });
  };

  if (view === "collapsed" || !isExpanded) {
    return (
      <Box
        onClick={() => { onToggle(); setView("details"); }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          cursor: "pointer",
          "&:hover": { bgcolor: "#F8FAFC" },
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#3B5998" }}>
          {pkg.name}
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E2B42" }}>
          ${pkg.price}
        </Typography>
      </Box>
    );
  }

  if (view === "details") {
    return (
      <Box
        sx={{
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#3B5998" }}>
            {pkg.name}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E2B42" }}>
            ${pkg.price}
          </Typography>
        </Box>

        {/* Description */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E2B42", mb: 0.5 }}>
            {t("consultants.description")}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
            {pkg.description}
          </Typography>
        </Box>

        {/* Consultation content */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E2B42", mb: 0.5 }}>
            {t("consultants.consultationContent")}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            {pkg.consultation_content}
          </Typography>
        </Box>

        {/* Duration */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E2B42", mb: 0.5 }}>
            {t("consultants.duration")}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            {pkg.duration_minutes} minutes
          </Typography>
        </Box>

        {/* Buttons */}
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setView("collapsed")}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              borderColor: "#E2E8F0",
              color: "#1E2B42",
              fontWeight: 500,
              fontSize: 13,
              py: 1,
              "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
            }}
          >
            {t("consultants.close")}
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setView("booking")}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              bgcolor: "#3B5998",
              fontWeight: 500,
              fontSize: 13,
              py: 1,
              "&:hover": { bgcolor: "#2D4A7A" },
            }}
          >
            {t("consultants.bookNow")}
          </Button>
        </Stack>
      </Box>
    );
  }

  // Derive unique dates and time slots for selected date from availableSlots
  const uniqueDates = Array.from(new Set(availableSlots.map((s) => s.date)));
  const selectedDateStr = selectedDay != null ? uniqueDates[selectedDay] : null;
  const timeSlotsForDay = selectedDateStr
    ? availableSlots
        .filter((s) => s.date === selectedDateStr)
        .map((s) => `${s.start_time}-${s.end_time}`)
    : [];

  // Booking view
  return (
    <Box
      sx={{
        border: "1px solid #E2E8F0",
        borderRadius: 2,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#3B5998" }}>
        {pkg.name}
      </Typography>

      {/* Available days */}
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E2B42", mb: 1.5 }}>
          {t("consultants.availableDays")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" sx={{ color: "text.secondary" }} onClick={() => scroll(daysRef, "left")}>
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Stack
            ref={daysRef}
            direction="row"
            spacing={1}
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {uniqueDates.map((dateStr, i) => {
              const day = formatDayFromDate(dateStr);
              const isSelected = selectedDay === i;
              return (
                <Box
                  key={dateStr}
                  onClick={() => { setSelectedDay(i); setSelectedSlot(null); }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 1,
                    px: 1.5,
                    border: "1px solid",
                    borderColor: isSelected ? "#3B5998" : "#E2E8F0",
                    borderRadius: 2,
                    cursor: "pointer",
                    bgcolor: isSelected ? "#3B5998" : "#fff",
                    color: isSelected ? "#fff" : "#1E2B42",
                    minWidth: 56,
                    flexShrink: 0,
                    "&:hover": {
                      borderColor: "#3B5998",
                    },
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 500 }}>
                    {day.dayOfWeek}
                  </Typography>
                  <Typography sx={{ fontSize: 11 }}>{day.month}</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{day.day}</Typography>
                </Box>
              );
            })}
          </Stack>
          <IconButton size="small" sx={{ color: "text.secondary" }} onClick={() => scroll(daysRef, "right")}>
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Available time */}
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E2B42", mb: 1.5 }}>
          {t("consultants.availableTime")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" sx={{ color: "text.secondary" }} onClick={() => scroll(slotsRef, "left")}>
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Stack
            ref={slotsRef}
            direction="row"
            spacing={1}
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {timeSlotsForDay.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <Box
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  sx={{
                    py: 1,
                    px: 1.5,
                    border: "1px solid",
                    borderColor: isSelected ? "#3B5998" : "#E2E8F0",
                    borderRadius: 2,
                    cursor: "pointer",
                    bgcolor: isSelected ? "#3B5998" : "#fff",
                    color: isSelected ? "#fff" : "#1E2B42",
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    "&:hover": {
                      borderColor: "#3B5998",
                    },
                  }}
                >
                  {slot}
                </Box>
              );
            })}
          </Stack>
          <IconButton size="small" sx={{ color: "text.secondary" }} onClick={() => scroll(slotsRef, "right")}>
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Request description */}
      <TextField
        label={t("consultants.describeRequest")}
        placeholder={t("consultants.describeRequestPlaceholder")}
        multiline
        rows={3}
        value={requestText}
        onChange={(e) => setRequestText(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": { borderRadius: 2 },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D5DAE1" },
          "& .MuiInputBase-input": { fontSize: 13 },
          "& .MuiInputLabel-root": { fontSize: 13 },
        }}
      />

      {/* Book for + price */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
          {t("consultants.bookFor")}
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1E2B42" }}>
          ${pkg.price}
        </Typography>
      </Box>

      {/* Buttons */}
      <Stack direction="row" spacing={1.5}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => setView("details")}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            borderColor: "#E2E8F0",
            color: "#1E2B42",
            fontWeight: 500,
            fontSize: 13,
            py: 1,
            "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
          }}
        >
          {t("consultants.close")}
        </Button>
        <Button
          variant="contained"
          fullWidth
          disabled={!selectedSlot || !selectedDateStr || booking}
          onClick={async () => {
            if (!selectedSlot || !selectedDateStr) return;
            const [startTime] = selectedSlot.split("-");
            const matchedSlot = availableSlots.find(
              (s) => s.date === selectedDateStr && s.start_time === startTime,
            );
            if (!matchedSlot) return;
            try {
              setBooking(true);
              const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  consultantId,
                  servicePackageId: pkg.id,
                  availabilitySlotId: matchedSlot.id,
                  userComment: requestText,
                }),
              });
              if (!res.ok) throw new Error("Booking failed");
              onBook();
            } catch (err) {
              console.error("Booking error:", err);
            } finally {
              setBooking(false);
            }
          }}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            bgcolor: "#3B5998",
            fontWeight: 500,
            fontSize: 13,
            py: 1,
            "&:hover": { bgcolor: "#2D4A7A" },
            "&.Mui-disabled": { bgcolor: "#3B5998", color: "#fff", opacity: 0.45 },
          }}
        >
          {booking ? "Booking..." : t("consultants.bookNow")}
        </Button>
      </Stack>
    </Box>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 3,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1E2B42" }}>
              {review.user_name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {review.user_country ?? ""}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <StarIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{review.rating}</Typography>
        </Box>
      </Box>

      {/* Text */}
      <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
        {review.text}
      </Typography>

      {/* Footer */}
      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
        {review.rating}/5
      </Typography>
    </Box>
  );
}

function SimilarConsultantCard({ consultant }: { consultant: SimilarConsultant }) {
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 3,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {/* Header: avatar + name + price */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {consultant.avatar_url ? (
            <Box component="img" src={consultant.avatar_url} alt={consultant.name} sx={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <Skeleton variant="circular" width={44} height={44} sx={{ flexShrink: 0 }} />
          )}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E2B42" }}>
              {consultant.name}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
              {consultant.title}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1E2B42" }}>
            ${consultant.hourly_rate}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            {t("consultants.perHour")}
          </Typography>
        </Box>
      </Box>

      {/* Description */}
      <Typography
        sx={{
          fontSize: 12.5,
          color: "text.secondary",
          lineHeight: 1.6,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {consultant.description}
      </Typography>

      {/* Rating + sessions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <StarIcon sx={{ fontSize: 16, color: "#F59E0B" }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
            {consultant.rating}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            ({consultant.review_count})
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            {t("consultants.sessions", { count: String(consultant.session_count) })}
          </Typography>
        </Box>
      </Box>

      {/* Buttons */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          fullWidth
          sx={{
            textTransform: "none",
            borderRadius: 2,
            borderColor: "#E2E8F0",
            color: "#1E2B42",
            fontWeight: 500,
            fontSize: 13,
            py: 0.8,
            "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
          }}
        >
          {t("consultants.message")}
        </Button>
        <Button
          variant="contained"
          fullWidth
          sx={{
            textTransform: "none",
            borderRadius: 2,
            bgcolor: "#3B5998",
            fontWeight: 500,
            fontSize: 13,
            py: 0.8,
            "&:hover": { bgcolor: "#2D4A7A" },
          }}
        >
          {t("consultants.bookNow")}
        </Button>
      </Stack>
    </Box>
  );
}
