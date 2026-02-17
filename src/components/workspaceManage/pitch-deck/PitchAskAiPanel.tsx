// src/components/workspaceManage/pitch-deck/PitchAskAiPanel.tsx
"use client";

import type { FC } from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import SpellcheckRoundedIcon from "@mui/icons-material/SpellcheckRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { toast } from "react-toastify";
import type { PitchDeckSlide, PitchDeckSlideContent } from "@/types/workspaces";

type AiAction = "summarize" | "rephrase" | "simplify" | "detail" | "grammar" | "translate";

const ACTIONS: Array<{
  id: AiAction;
  label: string;
  icon: typeof SummarizeRoundedIcon;
  hasMenu?: boolean;
}> = [
  { id: "summarize", label: "Summarize", icon: SummarizeRoundedIcon },
  { id: "rephrase", label: "Rephrase", icon: FormatQuoteRoundedIcon },
  { id: "simplify", label: "Simplify", icon: TextFieldsRoundedIcon },
  { id: "detail", label: "Detail", icon: NotesRoundedIcon },
  { id: "grammar", label: "Grammar", icon: SpellcheckRoundedIcon },
  { id: "translate", label: "Translate", icon: TranslateRoundedIcon, hasMenu: true },
];

const TRANSLATE_LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "Arabic",
  "German",
  "Italian",
];

export type PitchAskAiPanelProps = {
  workspaceId: string;
  selectedSlide: PitchDeckSlide | null;
  onApply: (slideId: string, content: PitchDeckSlideContent) => Promise<void>;
  onClose: () => void;
};

// Helper to extract text from slide content
const extractSlideText = (content: PitchDeckSlideContent): string => {
  switch (content.type) {
    case "title_only":
      return content.title;
    case "title_bullets":
      return `${content.title}\n\n${content.bullets.join("\n")}`;
    case "title_text":
      return `${content.title}\n\n${content.text}`;
    case "title_image":
      return content.title;
    case "two_columns": {
      const leftText = content.leftColumn.bullets?.join("\n") ?? content.leftColumn.text ?? "";
      const rightText = content.rightColumn.bullets?.join("\n") ?? content.rightColumn.text ?? "";
      return `${content.title}\n\nLeft:\n${leftText}\n\nRight:\n${rightText}`;
    }
    case "comparison":
      return `${content.title}\n\n${content.headers.join(" | ")}\n${content.rows.map((row: string[]) => row.join(" | ")).join("\n")}`;
    case "timeline":
      return `${content.title}\n\n${content.entries.map((e: { date: string; title: string; description?: string }) => `${e.date}: ${e.title}${e.description ? ` - ${e.description}` : ""}`).join("\n")}`;
    case "team_grid":
      return `${content.title}\n\n${content.members.map((m: { name: string; role: string }) => `${m.name} - ${m.role}`).join("\n")}`;
    case "metrics":
      return `${content.title}\n\n${content.metrics.map((m: { label: string; value: string }) => `${m.label}: ${m.value}`).join("\n")}`;
    case "quote":
      return `"${content.quote}"\n— ${content.author ?? ""}`;
    case "blank":
      return "";
    default:
      return "";
  }
};

// Helper to apply AI text back to slide content
const applyTextToContent = (content: PitchDeckSlideContent, newText: string): PitchDeckSlideContent => {
  const rawLines = newText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const title = rawLines[0] ?? "";
  const bodyLines = rawLines.slice(1);
  const removeBulletPrefix = (line: string) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
  const parseDelimitedLine = (line: string): string[] => {
    if (line.includes("|")) {
      return line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
    }
    if (line.includes("\t")) {
      return line
        .split("\t")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
    }
    return line
      .split(",")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  };

  switch (content.type) {
    case "title_only":
      return {
        ...content,
        title: title || content.title,
        subtitle: bodyLines.length > 0 ? bodyLines.join(" ") : content.subtitle,
      };
    case "title_bullets": {
      const nextBullets = bodyLines
        .map(removeBulletPrefix)
        .filter((line) => line.length > 0);
      return {
        ...content,
        title: title || content.title,
        bullets: nextBullets.length > 0 ? nextBullets : content.bullets,
      };
    }
    case "title_text":
      return {
        ...content,
        title: title || content.title,
        text: bodyLines.join("\n") || content.text,
      };
    case "title_image":
      return {
        ...content,
        title: title || content.title,
      };
    case "two_columns": {
      const fullBody = bodyLines.join("\n");
      const leftMatch = /left\s*:\s*([\s\S]*?)(?:\n\s*right\s*:|$)/i.exec(fullBody);
      const rightMatch = /right\s*:\s*([\s\S]*)/i.exec(fullBody);

      const fallbackSplitIndex = Math.ceil(bodyLines.length / 2);
      const fallbackLeft = bodyLines.slice(0, fallbackSplitIndex);
      const fallbackRight = bodyLines.slice(fallbackSplitIndex);

      const leftLines = (leftMatch?.[1] ?? "")
        .split("\n")
        .map((line) => removeBulletPrefix(line))
        .filter((line) => line.length > 0);
      const rightLines = (rightMatch?.[1] ?? "")
        .split("\n")
        .map((line) => removeBulletPrefix(line))
        .filter((line) => line.length > 0);

      const resolvedLeft = leftLines.length > 0 ? leftLines : fallbackLeft.map(removeBulletPrefix);
      const resolvedRight = rightLines.length > 0 ? rightLines : fallbackRight.map(removeBulletPrefix);

      const nextLeftColumn = { ...content.leftColumn };
      if ((content.leftColumn.bullets?.length ?? 0) > 0) {
        nextLeftColumn.bullets = resolvedLeft.length > 0 ? resolvedLeft : content.leftColumn.bullets;
      } else {
        nextLeftColumn.text = resolvedLeft.join("\n") || content.leftColumn.text;
      }

      const nextRightColumn = { ...content.rightColumn };
      if ((content.rightColumn.bullets?.length ?? 0) > 0) {
        nextRightColumn.bullets = resolvedRight.length > 0 ? resolvedRight : content.rightColumn.bullets;
      } else {
        nextRightColumn.text = resolvedRight.join("\n") || content.rightColumn.text;
      }

      return {
        ...content,
        title: title || content.title,
        leftColumn: nextLeftColumn,
        rightColumn: nextRightColumn,
      };
    }
    case "comparison": {
      if (bodyLines.length === 0) {
        return { ...content, title: title || content.title };
      }
      const headers = parseDelimitedLine(bodyLines[0] ?? "");
      const rows = bodyLines.slice(1).map(parseDelimitedLine).filter((row) => row.length > 0);
      return {
        ...content,
        title: title || content.title,
        headers: headers.length > 0 ? headers : content.headers,
        rows: rows.length > 0 ? rows : content.rows,
      };
    }
    case "timeline": {
      const entries: Array<{ date: string; title: string; description?: string }> = [];
      bodyLines.forEach((line) => {
        if (line.includes(":")) {
          const [date, rest] = line.split(/:(.+)/).map((part) => part.trim());
          if (!date || !rest) return;
          const [entryTitle, ...descParts] = rest.split(" - ").map((part) => part.trim());
          const resolvedEntryTitle = entryTitle && entryTitle.length > 0 ? entryTitle : rest;
          const resolvedDescription = descParts.join(" - ");
          entries.push({
            date,
            title: resolvedEntryTitle,
            description: resolvedDescription.length > 0 ? resolvedDescription : undefined,
          });
          return;
        }
        if (line.includes(" - ")) {
          const [date, entryTitle, ...descParts] = line.split(" - ").map((part) => part.trim());
          if (!date || !entryTitle) return;
          entries.push({
            date,
            title: entryTitle,
            description: descParts.join(" - ").length > 0 ? descParts.join(" - ") : undefined,
          });
        }
      });

      return {
        ...content,
        title: title || content.title,
        entries: entries.length > 0 ? entries : content.entries,
      };
    }
    case "team_grid": {
      const members: Array<{ name: string; role: string; bio?: string }> = [];
      bodyLines.forEach((line) => {
        const [name, role, ...bioParts] = line.split(" - ").map((part) => part.trim());
        if (!name || !role) return;
        members.push({
          name,
          role,
          bio: bioParts.join(" - ").length > 0 ? bioParts.join(" - ") : undefined,
        });
      });

      return {
        ...content,
        title: title || content.title,
        members: members.length > 0 ? members : content.members,
      };
    }
    case "metrics": {
      const metrics: Array<{ value: string; label: string; description?: string }> = [];
      bodyLines.forEach((line) => {
        if (line.includes("|")) {
          const [value, label, description] = line.split("|").map((part) => part.trim());
          if (!value || !label) return;
          metrics.push({
            value,
            label,
            description: (description ?? "").length > 0 ? description : undefined,
          });
          return;
        }
        if (line.includes(":")) {
          const [label, value] = line.split(/:(.+)/).map((part) => part.trim());
          if (!label || !value) return;
          metrics.push({ value, label });
        }
      });

      return {
        ...content,
        title: title || content.title,
        metrics: metrics.length > 0 ? metrics : content.metrics,
      };
    }
    case "quote": {
      const quoteLine = rawLines[0]?.replace(/^["'“”]|["'“”]$/g, "") ?? "";
      const authorLine = rawLines[1]?.replace(/^[—-]\s*/, "") ?? "";
      const [author, ...authorTitleParts] = authorLine
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      return {
        ...content,
        quote: quoteLine || content.quote,
        author: author ?? content.author,
        authorTitle: authorTitleParts.join(", ") || content.authorTitle,
      };
    }
    case "blank":
      return content;
    default:
      return content;
  }
};

const PitchAskAiPanel: FC<PitchAskAiPanelProps> = ({
  workspaceId,
  selectedSlide,
  onApply,
  onClose,
}) => {
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [translateAnchor, setTranslateAnchor] = useState<null | HTMLElement>(null);
  const [targetLanguage, setTargetLanguage] = useState("English");

  // Update draft text when selected slide changes
  useEffect(() => {
    if (selectedSlide) {
      setDraftText(extractSlideText(selectedSlide.content));
    } else {
      setDraftText("");
    }
  }, [selectedSlide]);

  const handleAction = useCallback(
    async (action: AiAction, language?: string) => {
      if (!workspaceId || !selectedSlide) return;
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/pitch-deck/ai/slide-suggest`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              text: draftText,
              label: selectedSlide.title,
              formatHint: selectedSlide.content.type,
              language,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate AI suggestion");
        }

        const data = (await response.json()) as { text: string };
        setDraftText(data.text ?? "");
        toast.success("AI suggestion generated");
      } catch (err) {
        console.error("AI suggestion error:", err);
        toast.error("Failed to generate AI suggestion");
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId, selectedSlide, draftText]
  );

  const handleApply = async () => {
    if (!selectedSlide) return;
    const newContent: PitchDeckSlideContent = {
      ...applyTextToContent(selectedSlide.content, draftText),
      generation_status: "draft",
      ai_generated_at: new Date().toISOString(),
    };
    await onApply(selectedSlide.id, newContent);
    toast.success("Slide content updated");
  };

  const actionButtons = useMemo(
    () =>
      ACTIONS.map((action) => (
        <Button
          key={action.id}
          onClick={(event) => {
            if (action.hasMenu) {
              setTranslateAnchor(event.currentTarget);
            } else {
              void handleAction(action.id);
            }
          }}
          disabled={isLoading || !selectedSlide}
          startIcon={<action.icon sx={{ fontSize: 16 }} />}
          endIcon={action.hasMenu ? <ChevronRightRoundedIcon sx={{ fontSize: 14 }} /> : undefined}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 1.5,
            border: "1px solid #E2E8F0",
            color: "#374151",
            bgcolor: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 12,
            px: 1.5,
            py: 1,
            gap: 0.5,
            "&:hover": {
              bgcolor: "#F8FAFC",
              borderColor: "#4C6AD2",
            },
            "&:disabled": {
              bgcolor: "#F3F4F6",
              color: "#9CA3AF",
            },
          }}
        >
          {action.label}
        </Button>
      )),
    [handleAction, isLoading, selectedSlide]
  );

  return (
    <Box
      sx={{
        width: 320,
        borderRight: "1px solid #E5E7EB",
        bgcolor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: "#EEF2FF",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoFixHighRoundedIcon sx={{ color: "#4C6AD2", fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E3A8A" }}>
            Ask AI
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280" }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Subtitle */}
      <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #EEF2F7", bgcolor: "#FFFFFF" }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#1E293B" }}>
          Edit Slide Content
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: "#64748B" }}>
          Transform your slide text with AI
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Selected slide info */}
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: 2,
            border: "1px solid #E5E7EB",
            p: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 11, color: "#6B7280", mb: 0.5 }}>
            Selected Slide
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
            {selectedSlide?.title ?? "No slide selected"}
          </Typography>
          {selectedSlide && (
            <Typography sx={{ fontSize: 11, color: "#9CA3AF", textTransform: "capitalize" }}>
              {selectedSlide.content.type.replace(/_/g, " ")}
            </Typography>
          )}
        </Box>

        {/* Text area */}
        <TextField
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          multiline
          minRows={6}
          maxRows={12}
          fullWidth
          placeholder={selectedSlide ? "Edit slide content..." : "Select a slide to edit"}
          disabled={!selectedSlide}
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              fontSize: 13,
            },
          }}
        />

        {/* AI Actions */}
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 1 }}>
            AI Actions
          </Typography>
          <Stack spacing={0.75}>
            {actionButtons}
          </Stack>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: "1px solid #E5E7EB",
          bgcolor: "#FFFFFF",
          display: "flex",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={isLoading}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            py: 1,
            borderRadius: 2,
            color: "#374151",
            bgcolor: "#F3F4F6",
            "&:hover": {
              bgcolor: "#E5E7EB",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          disabled={isLoading || !draftText.trim() || !selectedSlide}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            py: 1,
            borderRadius: 2,
            color: "#FFFFFF",
            bgcolor: "#4C6AD2",
            "&:hover": {
              bgcolor: "#3B5AC5",
            },
            "&:disabled": {
              bgcolor: "#A5B4FC",
              color: "#FFFFFF",
            },
          }}
        >
          {isLoading ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : "Apply"}
        </Button>
      </Box>

      {/* Translate menu */}
      <Menu
        anchorEl={translateAnchor}
        open={Boolean(translateAnchor)}
        onClose={() => setTranslateAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {TRANSLATE_LANGUAGES.map((lang) => (
          <MenuItem
            key={lang}
            selected={lang === targetLanguage}
            onClick={() => {
              setTranslateAnchor(null);
              setTargetLanguage(lang);
              void handleAction("translate", lang);
            }}
            sx={{ fontSize: 13 }}
          >
            {lang}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default PitchAskAiPanel;
