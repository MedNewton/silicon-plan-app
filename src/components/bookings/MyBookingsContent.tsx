// src/components/bookings/MyBookingsContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, Skeleton, Button, Stack, Divider, Drawer, IconButton, CircularProgress, Dialog } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/* ── types ── */

type BookingStatus = "upcoming" | "pending" | "finished" | "cancelled";

type Booking = {
  id: string;
  consultant_id: string;
  consultantName: string;
  company: string;
  date: string;
  time: string;
  type: string;
  status: BookingStatus;
  duration_minutes: number;
  cost: number;
  payment_status: string;
  user_comment: string;
  booking_date: string;
  start_time: string;
  end_time: string;
};

/* ── helpers ── */

function formatBookingDate(dateStr: string, startTime: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en", { month: "short" });
  const hhmm = startTime.slice(0, 5);
  return `${day} ${month} ${hhmm}`;
}

function formatDrawerDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en", { month: "long" });
  const weekday = d.toLocaleString("en", { weekday: "long" });
  return `${day} ${month} (${weekday})`;
}

function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)}–${end.slice(0, 5)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h} hour${h > 1 ? "s" : ""}`;
}

type TabKey = "all" | "upcoming" | "pending" | "finished" | "cancelled";

const STATUS_COLORS: Record<BookingStatus, { color: string; bg: string; border: string }> = {
  upcoming: { color: "#1B7A3D", bg: "#F0FDF4", border: "#BBF7D0" },
  pending: { color: "#92600F", bg: "#FFFBEB", border: "#FDE68A" },
  finished: { color: "#1B7A3D", bg: "#F0FDF4", border: "#BBF7D0" },
  cancelled: { color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" },
};

export default function MyBookingsContent({ onNavigateToConsultants, onNavigateToConsultant }: { onNavigateToConsultants?: () => void; onNavigateToConsultant?: (consultantId: string) => void }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as { bookings?: Array<{
        id: string;
        consultant_id: string;
        consultant_name: string;
        company: string;
        service_name: string;
        status: BookingStatus;
        booking_date: string;
        start_time: string;
        end_time: string;
        duration_minutes: number;
        cost: number;
        payment_status: string;
        user_comment: string;
      }> };
      const raw = data.bookings ?? [];
      setBookings(
        raw.map((b) => ({
          id: b.id,
          consultant_id: b.consultant_id,
          consultantName: b.consultant_name,
          company: b.company,
          date: formatBookingDate(b.booking_date, b.start_time),
          time: formatTimeRange(b.start_time, b.end_time),
          type: b.service_name,
          status: b.status,
          duration_minutes: b.duration_minutes,
          cost: b.cost,
          payment_status: b.payment_status,
          user_comment: b.user_comment,
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
        })),
      );
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const filtered =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  const upcomingCount = bookings.filter((b) => b.status === "upcoming").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const finishedCount = bookings.filter((b) => b.status === "finished").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  const statusLabel = (status: BookingStatus) => {
    const key = `bookings.status${status.charAt(0).toUpperCase()}${status.slice(1)}` as const;
    return t(key as "bookings.statusUpcoming");
  };

  const STATUS_ORDER: BookingStatus[] = ["upcoming", "pending", "finished", "cancelled"];

  const renderGrouped = () => {
    const groups = STATUS_ORDER
      .map((status) => ({
        status,
        bookings: bookings.filter((b) => b.status === status),
      }))
      .filter((g) => g.bookings.length > 0);

    return groups.map((group, i) => (
      <Box key={group.status} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {i > 0 && (
          <Divider sx={{ my: 1, borderColor: "#E2E8F0" }} />
        )}
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E2B42", textTransform: "capitalize" }}>
          {statusLabel(group.status)}
        </Typography>
        {group.bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} statusLabel={statusLabel} onClick={() => setSelectedBooking(booking)} />
        ))}
      </Box>
    ));
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: t("bookings.allSessions", { count: String(bookings.length) }) },
    { key: "upcoming", label: t("bookings.upcoming", { count: String(upcomingCount) }) },
    { key: "pending", label: t("bookings.pending", { count: String(pendingCount) }) },
    { key: "finished", label: t("bookings.finished", { count: String(finishedCount) }) },
    { key: "cancelled", label: t("bookings.cancelled", { count: String(cancelledCount) }) },
  ];

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff" }}>
        <CircularProgress size={40} sx={{ color: "#3B5998" }} />
      </Box>
    );
  }

  if (selectedBooking) {
    return (
      <BookingDetailView
        booking={selectedBooking}
        consultantBookings={bookings.filter(
          (b) => b.consultant_id === selectedBooking.consultant_id,
        )}
        onBack={() => setSelectedBooking(null)}
        onRefresh={fetchBookings}
        onNavigateToConsultant={onNavigateToConsultant}
      />
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      {/* Tabs */}
      <Box
        sx={{
          width: "100%",
          borderBottom: "1px solid rgba(226,232,240,1)",
          display: "flex",
          justifyContent: "center",
          pt: 3,
          pb: 1,
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack direction="row" spacing={6} alignItems="flex-end" justifyContent="center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                disableRipple
                onClick={() => setActiveTab(tab.key)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  fontSize: 13,
                  px: 2,
                  pb: 1.2,
                  borderRadius: 0,
                  borderBottomWidth: 2,
                  borderBottomStyle: "solid",
                  borderColor: isActive ? "#4C6AD2" : "transparent",
                  bgcolor: "transparent",
                  boxShadow: "none",
                  color: isActive ? "text.secondary" : "text.primary",
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      {/* Booking list or empty state */}
      {bookings.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: 400,
              px: 3,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 32, color: "#94A3B8" }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1E2B42", mb: 1 }}>
              {t("bookings.emptyTitle")}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.7, mb: 3 }}>
              {t("bookings.emptyDescription")}
            </Typography>
            <Button
              variant="contained"
              onClick={onNavigateToConsultants}
              sx={{
                textTransform: "none",
                borderRadius: 2.5,
                bgcolor: "#3B5998",
                fontWeight: 600,
                fontSize: 14,
                px: 4,
                py: 1.2,
                "&:hover": { bgcolor: "#2D4A7A" },
              }}
            >
              {t("bookings.emptyAction")}
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            py: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 2 }}>
            {activeTab === "all"
              ? renderGrouped()
              : filtered.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} statusLabel={statusLabel} onClick={() => setSelectedBooking(booking)} />
                ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function BookingCard({
  booking,
  statusLabel,
  onClick,
}: {
  booking: { id: string; consultantName: string; company: string; date: string; type: string; status: "upcoming" | "pending" | "finished" | "cancelled" };
  statusLabel: (status: "upcoming" | "pending" | "finished" | "cancelled") => string;
  onClick?: () => void;
}) {
  const sc = STATUS_COLORS[booking.status];
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        p: 2,
        border: "1px solid #E2E8F0",
        borderRadius: 3,
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { bgcolor: "#FAFBFF" } : {},
      }}
    >
      <Skeleton
        variant="rounded"
        width={80}
        height={80}
        sx={{ borderRadius: 2, flexShrink: 0 }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1E2B42" }}>
          {booking.consultantName}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>
          {booking.company}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label={booking.date}
            size="small"
            variant="outlined"
            sx={{ borderRadius: 1.5, borderColor: "#E2E8F0", fontSize: 12, height: 26 }}
          />
          <Chip
            label={booking.type}
            size="small"
            variant="outlined"
            sx={{ borderRadius: 1.5, borderColor: "#E2E8F0", fontSize: 12, height: 26 }}
          />
        </Box>
      </Box>
      <Chip
        label={statusLabel(booking.status)}
        size="small"
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: sc.color,
          bgcolor: sc.bg,
          border: `1px solid ${sc.border}`,
          borderRadius: 2,
          height: 28,
          alignSelf: "flex-start",
        }}
      />
    </Box>
  );
}

/* ── Booking Detail View ── */

function BookingDetailView({
  booking,
  consultantBookings,
  onBack,
  onRefresh,
  onNavigateToConsultant,
}: {
  booking: Booking;
  consultantBookings: Booking[];
  onBack: () => void;
  onRefresh: () => void;
  onNavigateToConsultant?: (consultantId: string) => void;
}) {
  const { t } = useLanguage();
  const consultantName = booking.consultantName;
  const [activeTab, setActiveTab] = useState<"consultant" | "video-call">("consultant");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const upcomingBooking = consultantBookings.find((b) => b.status === "upcoming");
  const pastBookings = consultantBookings.filter((b) => b.status !== "upcoming");

  const statusLabel = (status: BookingStatus) => {
    const key = `bookings.status${status.charAt(0).toUpperCase()}${status.slice(1)}` as const;
    return t(key as "bookings.statusUpcoming");
  };

  const tabs: { key: "consultant" | "video-call"; label: string }[] = [
    { key: "consultant", label: consultantName },
    { key: "video-call", label: t("bookings.videoCall") },
  ];

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      {/* Back button + Tabs row */}
      <Box
        sx={{
          width: "100%",
          borderBottom: "1px solid rgba(226,232,240,1)",
          display: "flex",
          alignItems: "flex-end",
          px: 3,
          pt: 2,
          bgcolor: "#FFFFFF",
        }}
      >
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
          onClick={onBack}
          sx={{
            textTransform: "none",
            borderRadius: 50,
            border: "1px solid #E2E8F0",
            color: "#1E2B42",
            fontWeight: 500,
            fontSize: 13,
            px: 2.5,
            py: 0.8,
            mb: 1,
            flexShrink: 0,
            "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
          }}
        >
          {t("bookings.mySessions")}
        </Button>

        {/* Tabs */}
        <Stack direction="row" spacing={6} alignItems="flex-end" justifyContent="center" sx={{ flex: 1 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                disableRipple
                onClick={() => setActiveTab(tab.key)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  fontSize: 13,
                  px: 2,
                  pb: 1.2,
                  borderRadius: 0,
                  borderBottomWidth: 2,
                  borderBottomStyle: "solid",
                  borderColor: isActive ? "#4C6AD2" : "transparent",
                  bgcolor: "transparent",
                  boxShadow: "none",
                  color: isActive ? "text.secondary" : "text.primary",
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 2 }}>
          {activeTab === "consultant" ? (
            <>
              {/* Next session */}
              {upcomingBooking && (
                <>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E2B42" }}>
                    {t("bookings.nextSession")}
                  </Typography>
                  <BookingCard booking={upcomingBooking} statusLabel={statusLabel} />
                </>
              )}

              {/* Past sessions */}
              {pastBookings.length > 0 && (
                <>
                  <Divider sx={{ my: 1, borderColor: "#E2E8F0" }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E2B42" }}>
                    {t("bookings.pastSessions")}
                  </Typography>
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} statusLabel={statusLabel} />
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {/* Video call tab */}
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
                {t("bookings.upcomingVideoMeeting")}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}>
                {t("bookings.meetingStartsIn", { name: consultantName })}
              </Typography>

              {upcomingBooking && (
                <BookingCard booking={upcomingBooking} statusLabel={statusLabel} />
              )}

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2.5,
                    borderColor: "#E2E8F0",
                    color: "#1E2B42",
                    fontWeight: 600,
                    fontSize: 14,
                    py: 1.5,
                    "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                  }}
                >
                  {t("bookings.viewDetails")}
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    borderRadius: 2.5,
                    bgcolor: "#3B4963",
                    fontWeight: 600,
                    fontSize: 14,
                    py: 1.5,
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#2E3A50", boxShadow: "none" },
                  }}
                >
                  {t("bookings.joinMeeting")}
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Box>

      {/* Booking info drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 540, maxWidth: "100vw" },
        }}
      >
        <BookingInfoDrawer
          booking={upcomingBooking ?? booking}
          onClose={() => setDrawerOpen(false)}
          statusLabel={statusLabel}
          onRefresh={onRefresh}
          onNavigateToConsultant={onNavigateToConsultant}
        />
      </Drawer>
    </Box>
  );
}

/* ── Booking Info Drawer ── */

function BookingInfoDrawer({
  booking,
  onClose,
  statusLabel,
  onRefresh,
  onNavigateToConsultant,
}: {
  booking: Booking;
  onClose: () => void;
  statusLabel: (status: BookingStatus) => string;
  onRefresh: () => void;
  onNavigateToConsultant?: (consultantId: string) => void;
}) {
  const { t } = useLanguage();
  const sc = STATUS_COLORS[booking.status];
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    try {
      setCancelling(true);
      const res = await fetch(`/api/bookings/${booking.id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to cancel");
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Failed to cancel booking", err);
    } finally {
      setCancelling(false);
    }
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        py: 1.5,
        px: 2.5,
      }}
    >
      <Typography sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0, mr: 3 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1E2B42", textAlign: "right" }}>
          {value}
        </Typography>
        {icon}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            label={statusLabel(booking.status)}
            size="small"
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: sc.color,
              bgcolor: sc.bg,
              border: `1px solid ${sc.border}`,
              borderRadius: 2,
              height: 28,
            }}
          />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
            {t("bookings.bookingInfo")}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            border: "1px solid #E2E8F0",
            borderRadius: 2,
            width: 36,
            height: 36,
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 3, pb: 3 }}>
        {/* Consultant / Service / Description / Comment */}
        <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 3, mb: 2 }}>
          <InfoRow
            label={t("bookings.consultant")}
            value={booking.consultantName}
            icon={<SendOutlinedIcon sx={{ fontSize: 18, color: "#64748B", transform: "rotate(-45deg)" }} />}
          />
          <InfoRow label={t("bookings.service")} value={booking.type} />
          {booking.user_comment && (
            <Box sx={{ py: 1.5, px: 2.5 }}>
              <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}>
                {t("bookings.yourComment")}
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#1E2B42", textAlign: "right" }}>
                {booking.user_comment}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Date / Time / Duration */}
        <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 3, mb: 2 }}>
          <InfoRow label={t("bookings.date")} value={formatDrawerDate(booking.booking_date)} />
          <InfoRow label={t("bookings.time")} value={formatTimeRange(booking.start_time, booking.end_time)} />
          <InfoRow label={t("bookings.duration")} value={formatDuration(booking.duration_minutes)} />
        </Box>

        {/* Cost / Payment */}
        <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 3 }}>
          <InfoRow label={t("bookings.costOfSession")} value={`$${booking.cost}`} />
          <InfoRow label={t("bookings.paymentStatus")} value={booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)} />
        </Box>
      </Box>

      {/* Footer buttons */}
      {booking.status !== "cancelled" && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: booking.status === "finished" ? "center" : "space-between",
            px: 3,
            py: 2.5,
            borderTop: "1px solid #E2E8F0",
          }}
        >
          {booking.status === "finished" ? (
            <Button
              variant="contained"
              fullWidth
              onClick={() => onNavigateToConsultant?.(booking.consultant_id)}
              sx={{
                textTransform: "none",
                borderRadius: 2.5,
                bgcolor: "#3B5998",
                fontWeight: 600,
                fontSize: 13,
                px: 3,
                py: 1,
                "&:hover": { bgcolor: "#2D4A7A" },
              }}
            >
              {t("bookings.bookAgain")}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                disabled={cancelling}
                onClick={() => setShowCancelConfirm(true)}
                sx={{
                  textTransform: "none",
                  borderRadius: 2.5,
                  borderColor: "#FECACA",
                  color: "#DC2626",
                  fontWeight: 600,
                  fontSize: 13,
                  px: 3,
                  py: 1,
                  "&:hover": { borderColor: "#FCA5A5", bgcolor: "#FEF2F2" },
                }}
              >
                {cancelling ? "..." : t("bookings.cancelBooking")}
              </Button>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2.5,
                    borderColor: "#E2E8F0",
                    color: "#1E2B42",
                    fontWeight: 600,
                    fontSize: 13,
                    px: 3,
                    py: 1,
                    "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                  }}
                >
                  {t("bookings.changeDetails")}
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2.5,
                    bgcolor: "#3B4963",
                    fontWeight: 600,
                    fontSize: 13,
                    px: 3,
                    py: 1,
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#2E3A50", boxShadow: "none" },
                  }}
                >
                  {t("bookings.videoCallBtn")}
                </Button>
              </Stack>
            </>
          )}
        </Box>
      )}

      {/* Cancel confirmation dialog */}
      <Dialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 4,
            maxWidth: 380,
            width: "100%",
            textAlign: "center",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 28 }}>⚠</Typography>
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
            {t("bookings.cancelConfirmTitle")}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
            {t("bookings.cancelConfirmText")}
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ width: "100%", mt: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setShowCancelConfirm(false)}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor: "#E2E8F0",
                color: "#1E2B42",
                fontWeight: 600,
                fontSize: 13,
                py: 1,
                "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
              }}
            >
              {t("bookings.cancelConfirmNo")}
            </Button>
            <Button
              variant="contained"
              fullWidth
              disabled={cancelling}
              onClick={handleCancel}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: "#DC2626",
                fontWeight: 600,
                fontSize: 13,
                py: 1,
                "&:hover": { bgcolor: "#B91C1C" },
              }}
            >
              {cancelling ? "..." : t("bookings.cancelConfirmYes")}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
