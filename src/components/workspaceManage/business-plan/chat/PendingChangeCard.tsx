// src/components/workspaceManage/business-plan/chat/PendingChangeCard.tsx
"use client";

import type { FC } from "react";
import { useState } from "react";
import { Box, Typography, Stack, Button, Chip } from "@mui/material";
import type {
  BusinessPlanPendingChange,
  BusinessPlanChapterWithSections,
  BusinessPlanSection,
} from "@/types/workspaces";

type PendingChangeCardProps = {
  change: BusinessPlanPendingChange;
  chaptersById: Map<string, BusinessPlanChapterWithSections>;
  sectionsById: Map<string, BusinessPlanSection>;
  onAccept: (changeId: string) => Promise<void> | void;
  onReject: (changeId: string) => Promise<void> | void;
};

const CHANGE_LABELS: Record<string, string> = {
  add_chapter: "Add chapter",
  update_chapter: "Update chapter",
  delete_chapter: "Delete chapter",
  add_section: "Add section",
  update_section: "Update section",
  delete_section: "Delete section",
  reorder_chapters: "Reorder chapters",
  reorder_sections: "Reorder sections",
};

const STATUS_COLORS: Record<string, "default" | "success" | "error" | "warning"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const summarizeContent = (content: unknown): string => {
  if (!content || typeof content !== "object") return "";
  const data = content as Record<string, unknown>;
  if (typeof data.text === "string") return data.text.slice(0, 140);
  if (Array.isArray(data.items)) return data.items.slice(0, 3).join(", ");
  if (Array.isArray(data.rows)) return `${data.rows.length} rows`;
  if (typeof data.url === "string") return data.url;
  if (Array.isArray(data.entries)) return `${data.entries.length} timeline entries`;
  return JSON.stringify(data).slice(0, 140);
};

const getTargetLabel = (
  change: BusinessPlanPendingChange,
  chaptersById: Map<string, BusinessPlanChapterWithSections>,
  sectionsById: Map<string, BusinessPlanSection>
): string => {
  if (change.change_type.includes("chapter")) {
    if (!change.target_id) return "New chapter";
    const chapter = chaptersById.get(change.target_id);
    return chapter ? `Chapter: ${chapter.title}` : `Chapter ID: ${change.target_id}`;
  }

  if (change.change_type.includes("section")) {
    if (!change.target_id) return "New section";
    const section = sectionsById.get(change.target_id);
    return section
      ? `Section: ${section.section_type}`
      : `Section ID: ${change.target_id}`;
  }

  return "Pending change";
};

const getPreviewText = (
  change: BusinessPlanPendingChange,
  chaptersById: Map<string, BusinessPlanChapterWithSections>
): string => {
  const data = change.proposed_data as Record<string, unknown>;

  if (change.change_type === "add_chapter" || change.change_type === "update_chapter") {
    const title = typeof data.title === "string" ? data.title : "Untitled chapter";
    return `Title: ${title}`;
  }

  if (change.change_type === "add_section") {
    const chapterId = data.chapter_id as string | undefined;
    const chapter = chapterId ? chaptersById.get(chapterId) : null;
    const sectionType = data.section_type ?? "section";
    return `Add ${sectionType} to ${chapter ? chapter.title : "selected chapter"}`;
  }

  if (change.change_type === "update_section") {
    if (data.content) {
      return summarizeContent(data.content);
    }
    return "Update section content";
  }

  if (change.change_type === "delete_section") {
    return "Remove this section from the plan";
  }

  if (change.change_type === "delete_chapter") {
    return "Remove this chapter and its sections";
  }

  if (change.change_type === "reorder_chapters") {
    return "Update chapter order";
  }

  if (change.change_type === "reorder_sections") {
    return "Update section order";
  }

  return "Proposed change";
};

const PendingChangeCard: FC<PendingChangeCardProps> = ({
  change,
  chaptersById,
  sectionsById,
  onAccept,
  onReject,
}) => {
  const status = change.status;
  const isPending = status === "pending";
  const [isResolving, setIsResolving] = useState(false);

  const handleAccept = async () => {
    setIsResolving(true);
    try {
      await onAccept(change.id);
    } finally {
      setIsResolving(false);
    }
  };

  const handleReject = async () => {
    setIsResolving(true);
    try {
      await onReject(change.id);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        bgcolor: "#FFFFFF",
        px: 2,
        py: 1.5,
        boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1F2933" }}>
            {CHANGE_LABELS[change.change_type] ?? "Pending change"}
          </Typography>
          <Chip
            size="small"
            label={status}
            color={STATUS_COLORS[status] ?? "default"}
            sx={{ textTransform: "capitalize" }}
          />
        </Stack>
        <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
          {getTargetLabel(change, chaptersById, sectionsById)}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#111827" }}>
          {getPreviewText(change, chaptersById)}
        </Typography>
        {isPending ? (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              onClick={() => void handleAccept()}
              disabled={isResolving}
              sx={{
                textTransform: "none",
                bgcolor: "#4C6AD2",
                "&:hover": { bgcolor: "#3F57C5" },
              }}
            >
              Accept
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => void handleReject()}
              disabled={isResolving}
              sx={{
                textTransform: "none",
                borderColor: "#E5E7EB",
                color: "#6B7280",
                "&:hover": { borderColor: "#CBD5F5", bgcolor: "#F9FAFF" },
              }}
            >
              Reject
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

export default PendingChangeCard;
