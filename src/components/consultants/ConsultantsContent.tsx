// src/components/consultants/ConsultantsContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  IconButton,
  Button,
  Chip,
  Stack,
  Skeleton,
  CircularProgress,
  Dialog,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import ConsultantDetailContent from "@/components/consultants/ConsultantDetailContent";
import ConsultantMessagesContent from "@/components/consultants/ConsultantMessagesContent";

type ConsultantsView =
  | { kind: "list" }
  | { kind: "detail"; consultantId: string }
  | { kind: "messages"; consultantId: string };

type ConsultantListItem = {
  id: string;
  name: string;
  title: string;
  description: string;
  skills: string[];
  totalSkills: number;
  hourly_rate: number;
  rating: number;
  review_count: number;
  session_count: number;
  avatar_url: string | null;
  video_url: string | null;
};

const FILTER_DROPDOWN_SX = {
  minWidth: 150,
  borderRadius: 50,
  bgcolor: "#fff",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D5DAE1",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#B0B8C4",
  },
  "& .MuiSelect-select": {
    py: 1.1,
    pl: 2.5,
    pr: "36px !important",
    fontSize: 14,
    color: "#1E2B42",
  },
  "& .MuiSvgIcon-root": {
    color: "#9AA4B8",
    fontSize: 22,
  },
} as const;

const SEARCH_FIELD_SX = {
  minWidth: 160,
  "& .MuiOutlinedInput-root": {
    borderRadius: 50,
    bgcolor: "#fff",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D5DAE1",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#B0B8C4",
  },
  "& .MuiInputBase-input": {
    py: 1.1,
    pl: 2,
    fontSize: 14,
  },
} as const;

export default function ConsultantsContent({ onNavigateToBookings, initialConsultantId }: { onNavigateToBookings?: () => void; initialConsultantId?: string | null } = {}) {
  const { t } = useLanguage();
  const [view, setView] = useState<ConsultantsView>(
    initialConsultantId ? { kind: "detail", consultantId: initialConsultantId } : { kind: "list" },
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [hourRate, setHourRate] = useState("");
  const [country, setCountry] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [availability, setAvailability] = useState("");

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [reviewConsultant, setReviewConsultant] = useState<ConsultantListItem | null>(null);
  const [consultants, setConsultants] = useState<ConsultantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  type RateBucket = { label: string; min: number; max: number };
  const [filterOptions, setFilterOptions] = useState<{
    industries: string[];
    countries: string[];
    availabilities: string[];
    serviceTypes: string[];
    rateBuckets: RateBucket[];
  }>({ industries: [], countries: [], availabilities: [], serviceTypes: [], rateBuckets: [] });

  // Fetch filter options + favorites once
  useEffect(() => {
    fetch("/api/consultants/filters")
      .then((r) => r.json() as Promise<{ industries: string[]; countries: string[]; availabilities: string[]; serviceTypes: string[]; rateBuckets: RateBucket[] }>)
      .then((data) => setFilterOptions(data))
      .catch(() => undefined);
    fetch("/api/consultants/favorites")
      .then((r) => r.json() as Promise<{ favoriteIds?: string[] }>)
      .then((data) => setFavoriteIds(new Set(data.favoriteIds ?? [])))
      .catch(() => undefined);
  }, []);

  const toggleFavorite = async (consultantId: string) => {
    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(consultantId)) next.delete(consultantId);
      else next.add(consultantId);
      return next;
    });
    try {
      await fetch("/api/consultants/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantId }),
      });
    } catch {
      // Revert on error
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(consultantId)) next.delete(consultantId);
        else next.add(consultantId);
        return next;
      });
    }
  };

  const fetchConsultants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (industry) params.set("industry", industry);
      if (country) params.set("country", country);
      if (availability) params.set("availability", availability);
      if (hourRate) {
        const bucket = filterOptions.rateBuckets.find((b) => b.label === hourRate);
        if (bucket) {
          params.set("minRate", String(bucket.min));
          params.set("maxRate", String(bucket.max));
        }
      }
      const qs = params.toString();
      const res = await fetch(`/api/consultants${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as { consultants?: ConsultantListItem[] };
      setConsultants(data.consultants ?? []);
    } catch (err) {
      console.error("Failed to load consultants", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, industry, country, availability, hourRate, filterOptions.rateBuckets]);

  useEffect(() => {
    void fetchConsultants();
  }, [fetchConsultants]);

  // Sort: favorites first, then by rating descending
  const sortedConsultants = [...consultants].sort((a, b) => {
    const aFav = favoriteIds.has(a.id) ? 0 : 1;
    const bFav = favoriteIds.has(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  if (view.kind === "messages") {
    return (
      <ConsultantMessagesContent
        consultantId={view.consultantId}
        onBack={() => setView({ kind: "list" })}
        onViewProfile={() => setView({ kind: "detail", consultantId: view.consultantId })}
        onBookConsultation={() => setView({ kind: "detail", consultantId: view.consultantId })}
      />
    );
  }

  if (view.kind === "detail") {
    return (
      <ConsultantDetailContent
        consultantId={view.consultantId}
        onBack={() => setView({ kind: "list" })}
        onNavigateToBookings={onNavigateToBookings}
      />
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#F7F8FC" }}>
      {/* Header bar */}
      <Box
        sx={{
          width: "100%",
          borderBottom: "1px solid rgba(226,232,240,1)",
          display: "flex",
          alignItems: "center",
          px: 4,
          pt: 3,
          pb: 2,
          bgcolor: "#FFFFFF",
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#1E2B42" }}>
          {t("consultants.breadcrumb")}
        </Typography>
      </Box>

      {/* Title + subtitle */}
      <Box sx={{ px: 4, pt: 2.5, pb: 2 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#1E2B42", mb: 1 }}>
          {t("consultants.title")}
        </Typography>
        <Typography
          sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.7, whiteSpace: "pre-line" }}
        >
          {t("consultants.subtitle")}
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ px: 4, pb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5 }}>
          <TextField
            size="small"
            placeholder={t("consultants.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ fontSize: 20, color: "#9AA4B8" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={SEARCH_FIELD_SX}
          />

          {[
            { value: industry, setter: setIndustry, label: t("consultants.filterIndustry"), options: filterOptions.industries },
            { value: hourRate, setter: setHourRate, label: t("consultants.filterHourRate"), options: filterOptions.rateBuckets.map((b) => b.label) },
            { value: country, setter: setCountry, label: t("consultants.filterCountry"), options: filterOptions.countries },
            { value: serviceType, setter: setServiceType, label: t("consultants.filterServiceTypes"), options: filterOptions.serviceTypes },
            { value: availability, setter: setAvailability, label: t("consultants.filterAvailability"), options: filterOptions.availabilities },
          ].map(({ value, setter, label, options }) => (
            <Select
              key={label}
              size="small"
              displayEmpty
              value={value}
              onChange={(e) => setter(e.target.value)}
              IconComponent={KeyboardArrowDownIcon}
              sx={FILTER_DROPDOWN_SX}
              renderValue={(v) => (v ? String(v) : label)}
            >
              <MenuItem value="">
                <em>{label}</em>
              </MenuItem>
              {options.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          ))}
        </Stack>
      </Box>

      {/* Results count + view toggle */}
      <Box sx={{ px: 4, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1E2B42" }}>
          {t("consultants.resultsCount", { count: String(consultants.length) })}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => setViewMode("list")}
            sx={{
              color: viewMode === "list" ? "#3B5998" : "#94A3B8",
              bgcolor: viewMode === "list" ? "rgba(59,89,152,0.08)" : "transparent",
              borderRadius: 1.5,
              width: 34,
              height: 34,
            }}
          >
            <ViewListOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode("grid")}
            sx={{
              color: viewMode === "grid" ? "#3B5998" : "#94A3B8",
              bgcolor: viewMode === "grid" ? "rgba(59,89,152,0.08)" : "transparent",
              borderRadius: 1.5,
              width: 34,
              height: 34,
            }}
          >
            <GridViewOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Consultant list / grid */}
      {loading ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
          <CircularProgress size={40} sx={{ color: "#3B5998" }} />
        </Box>
      ) : viewMode === "list" ? (
        <Box sx={{ px: 4, pb: 4, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {sortedConsultants.map((c) => (
            <ConsultantCard
              key={c.id}
              consultant={c}
              isFavorite={favoriteIds.has(c.id)}
              onToggleFavorite={() => void toggleFavorite(c.id)}
              onSelect={() => setView({ kind: "detail", consultantId: c.id })}
              onMessage={() => setView({ kind: "messages", consultantId: c.id })}
              onRate={() => setReviewConsultant(c)}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            px: 4,
            pb: 4,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 2.5,
          }}
        >
          {sortedConsultants.map((c) => (
            <ConsultantGridCard
              key={c.id}
              consultant={c}
              isFavorite={favoriteIds.has(c.id)}
              onToggleFavorite={() => void toggleFavorite(c.id)}
              onSelect={() => setView({ kind: "detail", consultantId: c.id })}
              onMessage={() => setView({ kind: "messages", consultantId: c.id })}
              onRate={() => setReviewConsultant(c)}
            />
          ))}
        </Box>
      )}

      {/* Review modal */}
      {reviewConsultant && (
        <ReviewModal
          consultantId={reviewConsultant.id}
          consultantName={reviewConsultant.name}
          onClose={() => setReviewConsultant(null)}
          onSubmitted={() => { setReviewConsultant(null); void fetchConsultants(); }}
        />
      )}
    </Box>
  );
}

function ConsultantCard({ consultant, isFavorite, onToggleFavorite, onSelect, onMessage, onRate }: { consultant: ConsultantListItem; isFavorite: boolean; onToggleFavorite: () => void; onSelect: () => void; onMessage: () => void; onRate: () => void }) {
  const { t } = useLanguage();
  const visibleSkills = consultant.skills.slice(0, 3);
  const extraSkills = consultant.totalSkills - visibleSkills.length;

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      {/* Left: info card */}
      <Box
        sx={{
          flex: 7,
          border: "1px solid #E2E8F0",
          borderRadius: 3,
          bgcolor: "#fff",
          p: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Row 1: avatar + name | price + heart */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 7 }}>
            {consultant.avatar_url ? (
              <Box
                component="img"
                src={consultant.avatar_url}
                alt={consultant.name}
                sx={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <Skeleton variant="circular" width={56} height={56} sx={{ flexShrink: 0 }} />
            )}
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
                {consultant.name}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                {consultant.title}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 3 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1E2B42" }}>
              ${consultant.hourly_rate}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              sx={{ color: isFavorite ? "#EC4899" : "#94A3B8" }}
            >
              {isFavorite ? <FavoriteIcon sx={{ fontSize: 22 }} /> : <FavoriteBorderIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* Row 2: description | buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 3, mt: 2, mb: 2 }}>
          <Typography
            sx={{
              fontSize: 13.5,
              color: "text.secondary",
              lineHeight: 1.7,
              flex: 7,
            }}
          >
            {consultant.description}
          </Typography>
          <Stack spacing={1} sx={{ flex: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onMessage();
              }}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor: "#E2E8F0",
                color: "#1E2B42",
                fontWeight: 500,
                fontSize: 14,
                "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
              }}
            >
              {t("consultants.message")}
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: "#3B5998",
                fontWeight: 500,
                fontSize: 14,
                "&:hover": { bgcolor: "#2D4A7A" },
              }}
            >
              {t("consultants.bookConsultation")}
            </Button>
          </Stack>
        </Box>

        {/* Skills + rating row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: "auto",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {visibleSkills.map((skill) => (
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
            {extraSkills > 0 && (
              <Chip
                label={t("consultants.skills", { count: String(extraSkills) })}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: "#E2E8F0",
                  fontSize: 12,
                  height: 28,
                }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexShrink: 0 }}>
            <Box
              onClick={(e) => { e.stopPropagation(); onRate(); }}
              sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover": { opacity: 0.7 } }}
            >
              <StarIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {consultant.rating}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                ({consultant.review_count})
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {t("consultants.sessions", { count: String(consultant.session_count) })}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Right: video box (separate from card) */}
      <Box
        sx={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 170,
            borderRadius: "12px 12px 0 0",
            overflow: "hidden",
          }}
        >
          {consultant.video_url ? (
            <Box
              component="video"
              src={consultant.video_url}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Skeleton
              variant="rectangular"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
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
        <Button
          variant="outlined"
          onClick={onSelect}
          sx={{
            mx: 1.5,
            my: 1.5,
            textTransform: "none",
            borderRadius: 2,
            borderColor: "#E2E8F0",
            color: "#1E2B42",
            fontWeight: 500,
            fontSize: 13,
            "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
          }}
        >
          {t("consultants.viewProfile")}
        </Button>
      </Box>
    </Box>
  );
}

function ConsultantGridCard({ consultant, isFavorite, onToggleFavorite, onSelect, onMessage, onRate }: { consultant: ConsultantListItem; isFavorite: boolean; onToggleFavorite: () => void; onSelect: () => void; onMessage: () => void; onRate: () => void }) {
  const { t } = useLanguage();
  const DESC_LIMIT = 100;
  const excerpt =
    consultant.description.length > DESC_LIMIT
      ? consultant.description.slice(0, DESC_LIMIT).trimEnd() + "…"
      : consultant.description;

  return (
    <Box
      sx={{
        border: "1px solid #E2E8F0",
        borderRadius: 3,
        bgcolor: "#fff",
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {/* Avatar + name + price */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", minWidth: 0 }}>
          {consultant.avatar_url ? (
            <Box
              component="img"
              src={consultant.avatar_url}
              alt={consultant.name}
              sx={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <Skeleton variant="circular" width={44} height={44} sx={{ flexShrink: 0 }} />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 700,
                color: "#1E2B42",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {consultant.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "text.secondary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {consultant.title}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, ml: 1 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#1E2B42" }}>
            ${consultant.hourly_rate}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            sx={{ color: isFavorite ? "#EC4899" : "#94A3B8", p: 0.3 }}
          >
            {isFavorite ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Description excerpt */}
      <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
        {excerpt}
      </Typography>

      {/* Rating */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          onClick={(e) => { e.stopPropagation(); onRate(); }}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover": { opacity: 0.7 } }}
        >
          <StarIcon sx={{ fontSize: 16, color: "#F59E0B" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {consultant.rating}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            ({consultant.review_count})
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {t("consultants.sessions", { count: String(consultant.session_count) })}
          </Typography>
        </Box>
      </Box>

      {/* Buttons */}
      <Stack spacing={1} sx={{ mt: "auto" }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={(e) => { e.stopPropagation(); onMessage(); }}
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
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
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
          {t("consultants.bookConsultation")}
        </Button>
      </Stack>
    </Box>
  );
}

/* ── Review Modal ── */

function ReviewModal({
  consultantId,
  consultantName,
  onClose,
  onSubmitted,
}: {
  consultantId: string;
  consultantName: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<{ allowed: boolean; hasExistingReview: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/consultants/${consultantId}/reviews`)
      .then((r) => r.json() as Promise<{ allowed: boolean; hasExistingReview: boolean }>)
      .then((data) => setEligibility(data))
      .catch(() => setEligibility({ allowed: false, hasExistingReview: false }))
      .finally(() => setLoading(false));
  }, [consultantId]);

  const handleSubmit = async () => {
    if (rating === 0 || !text.trim()) return;
    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`/api/consultants/${consultantId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to submit");
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 0 } }}>
      <Box sx={{ p: 3.5 }}>
        {/* Title */}
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1E2B42", mb: 0.5 }}>
          {t("consultants.reviewTitle")}
        </Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 3 }}>
          {consultantName}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ color: "#3B5998" }} />
          </Box>
        ) : eligibility && !eligibility.allowed ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>
              {t("consultants.reviewNoBooking")}
            </Typography>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor: "#E2E8F0",
                color: "#1E2B42",
                fontWeight: 500,
                fontSize: 14,
                "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
              }}
            >
              {t("consultants.reviewBrowse")}
            </Button>
          </Box>
        ) : eligibility?.hasExistingReview ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>
              {t("consultants.reviewAlreadyDone")}
            </Typography>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor: "#E2E8F0",
                color: "#1E2B42",
                fontWeight: 500,
                fontSize: 14,
                "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
              }}
            >
              OK
            </Button>
          </Box>
        ) : (
          <>
            {/* Star rating */}
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1E2B42", mb: 1 }}>
              {t("consultants.reviewRating")}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mb: 2.5 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton
                  key={star}
                  size="small"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  sx={{ p: 0.3 }}
                >
                  {star <= displayRating ? (
                    <StarIcon sx={{ fontSize: 32, color: "#F59E0B" }} />
                  ) : (
                    <StarBorderIcon sx={{ fontSize: 32, color: "#D5DAE1" }} />
                  )}
                </IconButton>
              ))}
            </Stack>

            {/* Text input */}
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder={t("consultants.reviewPlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              sx={{
                mb: 2.5,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
              }}
            />

            {error && (
              <Typography sx={{ fontSize: 13, color: "#DC2626", mb: 1.5 }}>
                {error}
              </Typography>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  borderColor: "#E2E8F0",
                  color: "#1E2B42",
                  fontWeight: 500,
                  fontSize: 14,
                  px: 3,
                  "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={rating === 0 || !text.trim() || submitting}
                onClick={() => void handleSubmit()}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "#3B5998",
                  fontWeight: 500,
                  fontSize: 14,
                  px: 3,
                  "&:hover": { bgcolor: "#2D4A7A" },
                }}
              >
                {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : t("consultants.reviewSubmit")}
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Dialog>
  );
}
