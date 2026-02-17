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
import { useLanguage } from "@/components/i18n/LanguageProvider";

type PendingChangeCardProps = {
  change: BusinessPlanPendingChange;
  chaptersById: Map<string, BusinessPlanChapterWithSections>;
  sectionsById: Map<string, BusinessPlanSection>;
  onAccept: (changeId: string) => Promise<void> | void;
  onReject: (changeId: string) => Promise<void> | void;
};

const STATUS_COLORS: Record<string, "default" | "success" | "error" | "warning"> = {
  pending: "warning",
  approved: "success",
  accepted: "success", // backward compatibility with legacy DB status
  rejected: "error",
};

// Normalize status for display (both 'accepted' and 'approved' → 'approved')
const normalizeDisplayStatus = (status: string): string => {
  if (status === "accepted") return "approved";
  return status;
};

const PendingChangeCard: FC<PendingChangeCardProps> = ({
  change,
  chaptersById,
  sectionsById,
  onAccept,
  onReject,
}) => {
  const { locale } = useLanguage();
  const copy =
    locale === "it"
      ? {
          changeLabels: {
            add_chapter: "Aggiungi capitolo",
            update_chapter: "Aggiorna capitolo",
            delete_chapter: "Elimina capitolo",
            add_task: "Aggiungi task",
            update_task: "Aggiorna task",
            delete_task: "Elimina task",
            add_section: "Aggiungi sezione",
            update_section: "Aggiorna sezione",
            delete_section: "Elimina sezione",
            reorder_chapters: "Riordina capitoli",
            reorder_sections: "Riordina sezioni",
          } as Record<string, string>,
          statusLabels: {
            pending: "In attesa",
            approved: "Approvato",
            rejected: "Rifiutato",
          } as Record<string, string>,
          pendingChange: "Modifica in attesa",
          newChapter: "Nuovo capitolo",
          newSection: "Nuova sezione",
          newTask: "Nuovo task",
          chapterLabel: (title: string) => `Capitolo: ${title}`,
          chapterIdLabel: (id: string) => `ID capitolo: ${id}`,
          sectionLabel: (sectionType: string) => `Sezione: ${sectionType}`,
          sectionIdLabel: (id: string) => `ID sezione: ${id}`,
          taskIdLabel: (id: string) => `ID task: ${id}`,
          untitledChapter: "Capitolo senza titolo",
          titleLabel: (value: string) => `Titolo: ${value}`,
          sectionFallback: "sezione",
          selectedChapter: "capitolo selezionato",
          addSectionToChapter: (sectionType: string, chapterTitle: string) =>
            `Aggiungi ${sectionType} a ${chapterTitle}`,
          untitledTask: "Task senza titolo",
          statusLabel: (value: string) => `Stato: ${value}`,
          levelLabel: (value: string) => `Livello: ${value}`,
          updateTaskDetails: "Aggiorna dettagli task",
          removeTask: "Rimuovi questo task",
          updateSectionContent: "Aggiorna contenuto sezione",
          removeSection: "Rimuovi questa sezione dal piano",
          removeChapter: "Rimuovi questo capitolo e le sue sezioni",
          updateChapterOrder: "Aggiorna ordine capitoli",
          updateSectionOrder: "Aggiorna ordine sezioni",
          proposedChange: "Modifica proposta",
          rowsSuffix: "righe",
          timelineEntriesSuffix: "voci timeline",
          taskStatusLabels: {
            todo: "Da fare",
            in_progress: "In corso",
            done: "Completato",
          } as Record<string, string>,
          accept: "Accetta",
          reject: "Rifiuta",
        }
      : {
          changeLabels: {
            add_chapter: "Add chapter",
            update_chapter: "Update chapter",
            delete_chapter: "Delete chapter",
            add_task: "Add task",
            update_task: "Update task",
            delete_task: "Delete task",
            add_section: "Add section",
            update_section: "Update section",
            delete_section: "Delete section",
            reorder_chapters: "Reorder chapters",
            reorder_sections: "Reorder sections",
          } as Record<string, string>,
          statusLabels: {
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
          } as Record<string, string>,
          pendingChange: "Pending change",
          newChapter: "New chapter",
          newSection: "New section",
          newTask: "New task",
          chapterLabel: (title: string) => `Chapter: ${title}`,
          chapterIdLabel: (id: string) => `Chapter ID: ${id}`,
          sectionLabel: (sectionType: string) => `Section: ${sectionType}`,
          sectionIdLabel: (id: string) => `Section ID: ${id}`,
          taskIdLabel: (id: string) => `Task ID: ${id}`,
          untitledChapter: "Untitled chapter",
          titleLabel: (value: string) => `Title: ${value}`,
          sectionFallback: "section",
          selectedChapter: "selected chapter",
          addSectionToChapter: (sectionType: string, chapterTitle: string) =>
            `Add ${sectionType} to ${chapterTitle}`,
          untitledTask: "Untitled task",
          statusLabel: (value: string) => `Status: ${value}`,
          levelLabel: (value: string) => `Level: ${value}`,
          updateTaskDetails: "Update task details",
          removeTask: "Remove this task",
          updateSectionContent: "Update section content",
          removeSection: "Remove this section from the plan",
          removeChapter: "Remove this chapter and its sections",
          updateChapterOrder: "Update chapter order",
          updateSectionOrder: "Update section order",
          proposedChange: "Proposed change",
          rowsSuffix: "rows",
          timelineEntriesSuffix: "timeline entries",
          taskStatusLabels: {
            todo: "To do",
            in_progress: "In progress",
            done: "Done",
          } as Record<string, string>,
          accept: "Accept",
          reject: "Reject",
        };

  const rawStatus = change.status;
  const status = normalizeDisplayStatus(rawStatus);
  const resolvedStatus = copy.statusLabels[status] ?? status;
  const isPending = rawStatus === "pending";
  const [isResolving, setIsResolving] = useState(false);

  const summarizeContent = (content: unknown): string => {
    if (!content || typeof content !== "object") return "";
    const data = content as Record<string, unknown>;
    if (typeof data.text === "string") return data.text.slice(0, 140);
    if (Array.isArray(data.items)) return data.items.slice(0, 3).join(", ");
    if (Array.isArray(data.rows)) return `${data.rows.length} ${copy.rowsSuffix}`;
    if (typeof data.url === "string") return data.url;
    if (Array.isArray(data.entries)) {
      return `${data.entries.length} ${copy.timelineEntriesSuffix}`;
    }
    return JSON.stringify(data).slice(0, 140);
  };

  const getTargetLabel = (): string => {
    if (change.change_type.includes("chapter")) {
      if (!change.target_id) return copy.newChapter;
      const chapter = chaptersById.get(change.target_id);
      return chapter
        ? copy.chapterLabel(chapter.title)
        : copy.chapterIdLabel(change.target_id);
    }

    if (change.change_type.includes("section")) {
      if (!change.target_id) return copy.newSection;
      const section = sectionsById.get(change.target_id);
      return section
        ? copy.sectionLabel(section.section_type)
        : copy.sectionIdLabel(change.target_id);
    }

    if (change.change_type.includes("task")) {
      if (!change.target_id) return copy.newTask;
      return copy.taskIdLabel(change.target_id);
    }

    return copy.pendingChange;
  };

  const getPreviewText = (): string => {
    const data = change.proposed_data ?? {};

    if (change.change_type === "add_chapter" || change.change_type === "update_chapter") {
      const title = typeof data.title === "string" ? data.title : copy.untitledChapter;
      return copy.titleLabel(title);
    }

    if (change.change_type === "add_section") {
      const chapterId = data.chapter_id as string | undefined;
      const chapter = chapterId ? chaptersById.get(chapterId) : null;
      const sectionType =
        typeof data.section_type === "string" ? data.section_type : copy.sectionFallback;
      return copy.addSectionToChapter(
        sectionType,
        chapter ? chapter.title : copy.selectedChapter
      );
    }

    if (change.change_type === "add_task") {
      const title = typeof data.title === "string" ? data.title : copy.untitledTask;
      const level =
        typeof data.hierarchy_level === "string"
          ? data.hierarchy_level.toUpperCase()
          : "TASK";
      return `${level}: ${title}`;
    }

    if (change.change_type === "update_task") {
      const parts: string[] = [];
      if (typeof data.title === "string") parts.push(copy.titleLabel(data.title));
      if (typeof data.status === "string") {
        const localizedStatus = copy.taskStatusLabels[data.status] ?? data.status;
        parts.push(copy.statusLabel(localizedStatus));
      }
      if (typeof data.hierarchy_level === "string") {
        parts.push(copy.levelLabel(data.hierarchy_level.toUpperCase()));
      }
      if (parts.length > 0) return parts.join(" | ");
      return copy.updateTaskDetails;
    }

    if (change.change_type === "delete_task") {
      return copy.removeTask;
    }

    if (change.change_type === "update_section") {
      if (data.content) {
        return summarizeContent(data.content);
      }
      return copy.updateSectionContent;
    }

    if (change.change_type === "delete_section") {
      return copy.removeSection;
    }

    if (change.change_type === "delete_chapter") {
      return copy.removeChapter;
    }

    if (change.change_type === "reorder_chapters") {
      return copy.updateChapterOrder;
    }

    if (change.change_type === "reorder_sections") {
      return copy.updateSectionOrder;
    }

    return copy.proposedChange;
  };

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
            {copy.changeLabels[change.change_type] ?? copy.pendingChange}
          </Typography>
          <Chip
            size="small"
            label={resolvedStatus}
            color={STATUS_COLORS[rawStatus] ?? STATUS_COLORS[status] ?? "default"}
            sx={{ textTransform: "capitalize" }}
          />
        </Stack>
        <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
          {getTargetLabel()}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#111827" }}>
          {getPreviewText()}
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
              {copy.accept}
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
              {copy.reject}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

export default PendingChangeCard;
