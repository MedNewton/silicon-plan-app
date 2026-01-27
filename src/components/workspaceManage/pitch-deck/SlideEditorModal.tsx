// src/components/workspaceManage/pitch-deck/SlideEditorModal.tsx
"use client";

import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  PitchDeckSlide,
  PitchDeckSlideContent,
  PitchDeckSlideContentType,
  PitchDeckTitleImageContent,
} from "@/types/workspaces";

export type SlideEditorModalProps = {
  open: boolean;
  slide: PitchDeckSlide | null;
  onClose: () => void;
  onSave: (params: { title: string; content: PitchDeckSlideContent }) => Promise<void> | void;
};

type DraftFields = {
  contentTitle: string;
  subtitle: string;
  bullets: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition: "left" | "right" | "top" | "bottom";
  leftTitle: string;
  leftText: string;
  leftBullets: string;
  rightTitle: string;
  rightText: string;
  rightBullets: string;
  headers: string;
  rows: string;
  timeline: string;
  team: string;
  metrics: string;
  quote: string;
  author: string;
  authorTitle: string;
};

const CONTENT_TYPES: Array<{ value: PitchDeckSlideContentType; label: string }> = [
  { value: "title_only", label: "Title Only" },
  { value: "title_bullets", label: "Title + Bullets" },
  { value: "title_text", label: "Title + Text" },
  { value: "title_image", label: "Title + Image" },
  { value: "two_columns", label: "Two Columns" },
  { value: "comparison", label: "Comparison Table" },
  { value: "timeline", label: "Timeline" },
  { value: "team_grid", label: "Team Grid" },
  { value: "metrics", label: "Metrics" },
  { value: "quote", label: "Quote" },
  { value: "blank", label: "Blank" },
];

const emptyDraft = (title: string): DraftFields => ({
  contentTitle: title,
  subtitle: "",
  bullets: "",
  text: "",
  imageUrl: "",
  imageAlt: "",
  imagePosition: "right",
  leftTitle: "",
  leftText: "",
  leftBullets: "",
  rightTitle: "",
  rightText: "",
  rightBullets: "",
  headers: "",
  rows: "",
  timeline: "",
  team: "",
  metrics: "",
  quote: "",
  author: "",
  authorTitle: "",
});

const parseLines = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const parseDelimitedRow = (value: string): string[] =>
  value
    .split("|")
    .map((cell) => cell.trim());

const parseDelimitedList = (value: string): string[] => {
  if (!value.trim()) return [];
  const delimiter = value.includes("|") ? "|" : value.includes(",") ? "," : "\n";
  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const buildDraftFromContent = (content: PitchDeckSlideContent, slideTitle: string): DraftFields => {
  const draft = emptyDraft(slideTitle);

  switch (content.type) {
    case "title_only":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        subtitle: content.subtitle ?? "",
      };
    case "title_bullets":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        bullets: content.bullets.join("\n"),
      };
    case "title_text":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        text: content.text,
      };
    case "title_image":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        imageUrl: content.imageUrl,
        imageAlt: content.imageAlt ?? "",
        imagePosition: content.imagePosition ?? "right",
      };
    case "two_columns":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        leftTitle: content.leftColumn.title ?? "",
        leftText: content.leftColumn.text ?? "",
        leftBullets: content.leftColumn.bullets?.join("\n") ?? "",
        rightTitle: content.rightColumn.title ?? "",
        rightText: content.rightColumn.text ?? "",
        rightBullets: content.rightColumn.bullets?.join("\n") ?? "",
      };
    case "comparison":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        headers: content.headers.join(" | "),
        rows: content.rows.map((row) => row.join(" | ")).join("\n"),
      };
    case "timeline":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        timeline: content.entries
          .map((entry) => [entry.date, entry.title, entry.description ?? ""].join(" | "))
          .join("\n"),
      };
    case "team_grid":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        team: content.members
          .map((member) => [member.name, member.role, member.bio ?? ""].join(" | "))
          .join("\n"),
      };
    case "metrics":
      return {
        ...draft,
        contentTitle: content.title ?? slideTitle,
        metrics: content.metrics
          .map((metric) => [metric.value, metric.label, metric.description ?? ""].join(" | "))
          .join("\n"),
      };
    case "quote":
      return {
        ...draft,
        quote: content.quote,
        author: content.author ?? "",
        authorTitle: content.authorTitle ?? "",
      };
    case "blank":
      return draft;
    default:
      return draft;
  }
};

const buildContentFromDraft = (
  contentType: PitchDeckSlideContentType,
  slideTitle: string,
  draft: DraftFields
): PitchDeckSlideContent => {
  const title = draft.contentTitle.trim() || slideTitle.trim() || "Untitled";

  switch (contentType) {
    case "title_only":
      return {
        type: "title_only",
        title,
        subtitle: draft.subtitle.trim() || undefined,
      };
    case "title_bullets":
      return {
        type: "title_bullets",
        title,
        bullets: parseLines(draft.bullets),
      };
    case "title_text":
      return {
        type: "title_text",
        title,
        text: draft.text.trim(),
      };
    case "title_image":
      return {
        type: "title_image",
        title,
        imageUrl: draft.imageUrl.trim(),
        imageAlt: draft.imageAlt.trim() || undefined,
        imagePosition: draft.imagePosition,
      } as PitchDeckTitleImageContent;
    case "two_columns":
      return {
        type: "two_columns",
        title,
        leftColumn: {
          title: draft.leftTitle.trim() || undefined,
          text: draft.leftText.trim() || undefined,
          bullets: parseLines(draft.leftBullets),
        },
        rightColumn: {
          title: draft.rightTitle.trim() || undefined,
          text: draft.rightText.trim() || undefined,
          bullets: parseLines(draft.rightBullets),
        },
      };
    case "comparison":
      return {
        type: "comparison",
        title,
        headers: parseDelimitedList(draft.headers),
        rows: parseLines(draft.rows).map(parseDelimitedRow),
      };
    case "timeline":
      return {
        type: "timeline",
        title,
        entries: parseLines(draft.timeline).map((line) => {
          const [date, entryTitle, description] = parseDelimitedRow(line);
          return {
            date: date ?? "",
            title: entryTitle ?? "",
            description: description && description.length > 0 ? description : undefined,
          };
        }),
      };
    case "team_grid":
      return {
        type: "team_grid",
        title,
        members: parseLines(draft.team).map((line) => {
          const [name, role, bio] = parseDelimitedRow(line);
          return {
            name: name ?? "",
            role: role ?? "",
            bio: bio && bio.length > 0 ? bio : undefined,
          };
        }),
      };
    case "metrics":
      return {
        type: "metrics",
        title,
        metrics: parseLines(draft.metrics).map((line) => {
          const [value, label, description] = parseDelimitedRow(line);
          return {
            value: value ?? "",
            label: label ?? "",
            description: description && description.length > 0 ? description : undefined,
          };
        }),
      };
    case "quote": {
      const author = draft.author.trim();
      const authorTitle = draft.authorTitle.trim();
      return {
        type: "quote",
        quote: draft.quote.trim(),
        author: author.length > 0 ? author : undefined,
        authorTitle: authorTitle.length > 0 ? authorTitle : undefined,
      };
    }
    case "blank":
      return { type: "blank" };
    default:
      return { type: "blank" };
  }
};

const SlideEditorModal: FC<SlideEditorModalProps> = ({ open, slide, onClose, onSave }) => {
  const [contentType, setContentType] = useState<PitchDeckSlideContentType>("title_text");
  const [slideTitle, setSlideTitle] = useState("");
  const [draft, setDraft] = useState<DraftFields>(emptyDraft(""));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!slide) return;
    setSlideTitle(slide.title);
    setContentType(slide.content.type);
    setDraft(buildDraftFromContent(slide.content, slide.title));
  }, [slide]);

  const handleContentTypeChange = (nextType: PitchDeckSlideContentType) => {
    setContentType(nextType);
    setDraft((prev) => {
      const next = emptyDraft(slideTitle || prev.contentTitle || "");
      next.contentTitle = prev.contentTitle || slideTitle;
      next.text = prev.text;
      next.bullets = prev.bullets;
      return next;
    });
  };

  const handleSave = async () => {
    if (!slide) return;
    setIsSaving(true);
    try {
      const content = buildContentFromDraft(contentType, slideTitle, draft);
      await onSave({ title: slideTitle.trim() || slide.title, content });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const helpText = useMemo(() => {
    switch (contentType) {
      case "comparison":
        return "Use | to separate columns. One row per line.";
      case "timeline":
        return "One entry per line: date | title | description";
      case "team_grid":
        return "One member per line: name | role | bio";
      case "metrics":
        return "One metric per line: value | label | description";
      default:
        return "";
    }
  }, [contentType]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Edit Slide</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {!slide ? (
          <Typography sx={{ color: "#6B7280" }}>Select a slide to edit.</Typography>
        ) : (
          <>
            <TextField
              label="Slide Title"
              value={slideTitle}
              onChange={(e) => setSlideTitle(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={contentType}
                label="Content Type"
                onChange={(e) => handleContentTypeChange(e.target.value as PitchDeckSlideContentType)}
              >
                {CONTENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {contentType !== "quote" && contentType !== "blank" ? (
              <TextField
                label="Content Title"
                value={draft.contentTitle}
                onChange={(e) => setDraft({ ...draft, contentTitle: e.target.value })}
                fullWidth
              />
            ) : null}

            {contentType === "title_only" ? (
              <TextField
                label="Subtitle"
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                fullWidth
              />
            ) : null}

            {contentType === "title_bullets" ? (
              <TextField
                label="Bullets (one per line)"
                value={draft.bullets}
                onChange={(e) => setDraft({ ...draft, bullets: e.target.value })}
                fullWidth
                multiline
                minRows={4}
              />
            ) : null}

            {contentType === "title_text" ? (
              <TextField
                label="Body Text"
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                fullWidth
                multiline
                minRows={5}
              />
            ) : null}

            {contentType === "title_image" ? (
              <Stack spacing={2}>
                <TextField
                  label="Image URL"
                  value={draft.imageUrl}
                  onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Image Alt Text"
                  value={draft.imageAlt}
                  onChange={(e) => setDraft({ ...draft, imageAlt: e.target.value })}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Image Position</InputLabel>
                  <Select
                    value={draft.imagePosition}
                    label="Image Position"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "left" || value === "right" || value === "top" || value === "bottom") {
                        setDraft({
                          ...draft,
                          imagePosition: value,
                        });
                      }
                    }}
                  >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                    <MenuItem value="top">Top</MenuItem>
                    <MenuItem value="bottom">Bottom</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            ) : null}

            {contentType === "two_columns" ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>
                    Left Column
                  </Typography>
                  <TextField
                    label="Left Title"
                    value={draft.leftTitle}
                    onChange={(e) => setDraft({ ...draft, leftTitle: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Left Text"
                    value={draft.leftText}
                    onChange={(e) => setDraft({ ...draft, leftText: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Left Bullets (one per line)"
                    value={draft.leftBullets}
                    onChange={(e) => setDraft({ ...draft, leftBullets: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Stack>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>
                    Right Column
                  </Typography>
                  <TextField
                    label="Right Title"
                    value={draft.rightTitle}
                    onChange={(e) => setDraft({ ...draft, rightTitle: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Right Text"
                    value={draft.rightText}
                    onChange={(e) => setDraft({ ...draft, rightText: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Right Bullets (one per line)"
                    value={draft.rightBullets}
                    onChange={(e) => setDraft({ ...draft, rightBullets: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Stack>
              </Box>
            ) : null}

            {contentType === "comparison" ? (
              <Stack spacing={1.5}>
                <TextField
                  label="Headers (separate with | or ,)"
                  value={draft.headers}
                  onChange={(e) => setDraft({ ...draft, headers: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Rows (one per line)"
                  helperText={helpText}
                  value={draft.rows}
                  onChange={(e) => setDraft({ ...draft, rows: e.target.value })}
                  fullWidth
                  multiline
                  minRows={4}
                />
              </Stack>
            ) : null}

            {contentType === "timeline" ? (
              <TextField
                label="Timeline Entries"
                helperText={helpText}
                value={draft.timeline}
                onChange={(e) => setDraft({ ...draft, timeline: e.target.value })}
                fullWidth
                multiline
                minRows={4}
              />
            ) : null}

            {contentType === "team_grid" ? (
              <TextField
                label="Team Members"
                helperText={helpText}
                value={draft.team}
                onChange={(e) => setDraft({ ...draft, team: e.target.value })}
                fullWidth
                multiline
                minRows={4}
              />
            ) : null}

            {contentType === "metrics" ? (
              <TextField
                label="Metrics"
                helperText={helpText}
                value={draft.metrics}
                onChange={(e) => setDraft({ ...draft, metrics: e.target.value })}
                fullWidth
                multiline
                minRows={4}
              />
            ) : null}

            {contentType === "quote" ? (
              <Stack spacing={1.5}>
                <TextField
                  label="Quote"
                  value={draft.quote}
                  onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
                  fullWidth
                  multiline
                  minRows={3}
                />
                <TextField
                  label="Author"
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Author Title"
                  value={draft.authorTitle}
                  onChange={(e) => setDraft({ ...draft, authorTitle: e.target.value })}
                  fullWidth
                />
              </Stack>
            ) : null}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!slide || isSaving}
          sx={{ bgcolor: "#4C6AD2", "&:hover": { bgcolor: "#3D5ABF" } }}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlideEditorModal;
