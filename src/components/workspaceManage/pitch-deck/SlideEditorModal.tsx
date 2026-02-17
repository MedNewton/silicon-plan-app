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
import { useLanguage } from "@/components/i18n/LanguageProvider";

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

const CONTENT_TYPES: PitchDeckSlideContentType[] = [
  "title_only",
  "title_bullets",
  "title_text",
  "title_image",
  "two_columns",
  "comparison",
  "timeline",
  "team_grid",
  "metrics",
  "quote",
  "blank",
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
  draft: DraftFields,
  existingContent?: PitchDeckSlideContent
): PitchDeckSlideContent => {
  const title = draft.contentTitle.trim() || slideTitle.trim() || "Untitled";
  const preservedMeta = {
    generation_status: existingContent?.generation_status,
    ai_generated_at: existingContent?.ai_generated_at,
  };

  switch (contentType) {
    case "title_only":
      return {
        ...preservedMeta,
        type: "title_only",
        title,
        subtitle: draft.subtitle.trim() || undefined,
      };
    case "title_bullets":
      return {
        ...preservedMeta,
        type: "title_bullets",
        title,
        bullets: parseLines(draft.bullets),
      };
    case "title_text":
      return {
        ...preservedMeta,
        type: "title_text",
        title,
        text: draft.text.trim(),
      };
    case "title_image":
      return {
        ...preservedMeta,
        type: "title_image",
        title,
        imageUrl: draft.imageUrl.trim(),
        imageAlt: draft.imageAlt.trim() || undefined,
        imagePosition: draft.imagePosition,
      } as PitchDeckTitleImageContent;
    case "two_columns":
      return {
        ...preservedMeta,
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
        ...preservedMeta,
        type: "comparison",
        title,
        headers: parseDelimitedList(draft.headers),
        rows: parseLines(draft.rows).map(parseDelimitedRow),
      };
    case "timeline":
      return {
        ...preservedMeta,
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
        ...preservedMeta,
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
        ...preservedMeta,
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
        ...preservedMeta,
        type: "quote",
        quote: draft.quote.trim(),
        author: author.length > 0 ? author : undefined,
        authorTitle: authorTitle.length > 0 ? authorTitle : undefined,
      };
    }
    case "blank":
      return { ...preservedMeta, type: "blank" };
    default:
      return { ...preservedMeta, type: "blank" };
  }
};

const SlideEditorModal: FC<SlideEditorModalProps> = ({ open, slide, onClose, onSave }) => {
  const { locale } = useLanguage();
  const [contentType, setContentType] = useState<PitchDeckSlideContentType>("title_text");
  const [slideTitle, setSlideTitle] = useState("");
  const [draft, setDraft] = useState<DraftFields>(emptyDraft(""));
  const [isSaving, setIsSaving] = useState(false);

  const copy =
    locale === "it"
      ? {
          editSlide: "Modifica slide",
          selectSlideToEdit: "Seleziona una slide da modificare.",
          slideTitle: "Titolo slide",
          contentType: "Tipo contenuto",
          contentTitle: "Titolo contenuto",
          subtitle: "Sottotitolo",
          bullets: "Punti elenco (uno per riga)",
          bodyText: "Testo",
          imageUrl: "URL immagine",
          imageAltText: "Testo alternativo immagine",
          imagePosition: "Posizione immagine",
          left: "Sinistra",
          right: "Destra",
          top: "Alto",
          bottom: "Basso",
          leftColumn: "Colonna sinistra",
          rightColumn: "Colonna destra",
          leftTitle: "Titolo sinistra",
          leftText: "Testo sinistra",
          leftBullets: "Punti sinistra (uno per riga)",
          rightTitle: "Titolo destra",
          rightText: "Testo destra",
          rightBullets: "Punti destra (uno per riga)",
          headers: "Intestazioni (separa con | o ,)",
          rows: "Righe (una per riga)",
          timelineEntries: "Voci timeline",
          teamMembers: "Membri del team",
          metrics: "Metriche",
          quote: "Citazione",
          author: "Autore",
          authorTitle: "Ruolo autore",
          cancel: "Annulla",
          save: "Salva",
          saving: "Salvataggio...",
          helpComparison: "Usa | per separare le colonne. Una riga per linea.",
          helpTimeline: "Una voce per riga: data | titolo | descrizione",
          helpTeam: "Un membro per riga: nome | ruolo | bio",
          helpMetrics: "Una metrica per riga: valore | etichetta | descrizione",
          typeTitleOnly: "Solo titolo",
          typeTitleBullets: "Titolo + Elenco",
          typeTitleText: "Titolo + Testo",
          typeTitleImage: "Titolo + Immagine",
          typeTwoColumns: "Due colonne",
          typeComparison: "Tabella confronto",
          typeTimeline: "Timeline",
          typeTeamGrid: "Griglia team",
          typeMetrics: "Metriche",
          typeQuote: "Citazione",
          typeBlank: "Vuota",
        }
      : {
          editSlide: "Edit Slide",
          selectSlideToEdit: "Select a slide to edit.",
          slideTitle: "Slide Title",
          contentType: "Content Type",
          contentTitle: "Content Title",
          subtitle: "Subtitle",
          bullets: "Bullets (one per line)",
          bodyText: "Body Text",
          imageUrl: "Image URL",
          imageAltText: "Image Alt Text",
          imagePosition: "Image Position",
          left: "Left",
          right: "Right",
          top: "Top",
          bottom: "Bottom",
          leftColumn: "Left Column",
          rightColumn: "Right Column",
          leftTitle: "Left Title",
          leftText: "Left Text",
          leftBullets: "Left Bullets (one per line)",
          rightTitle: "Right Title",
          rightText: "Right Text",
          rightBullets: "Right Bullets (one per line)",
          headers: "Headers (separate with | or ,)",
          rows: "Rows (one per line)",
          timelineEntries: "Timeline Entries",
          teamMembers: "Team Members",
          metrics: "Metrics",
          quote: "Quote",
          author: "Author",
          authorTitle: "Author Title",
          cancel: "Cancel",
          save: "Save",
          saving: "Saving...",
          helpComparison: "Use | to separate columns. One row per line.",
          helpTimeline: "One entry per line: date | title | description",
          helpTeam: "One member per line: name | role | bio",
          helpMetrics: "One metric per line: value | label | description",
          typeTitleOnly: "Title Only",
          typeTitleBullets: "Title + Bullets",
          typeTitleText: "Title + Text",
          typeTitleImage: "Title + Image",
          typeTwoColumns: "Two Columns",
          typeComparison: "Comparison Table",
          typeTimeline: "Timeline",
          typeTeamGrid: "Team Grid",
          typeMetrics: "Metrics",
          typeQuote: "Quote",
          typeBlank: "Blank",
        };

  const contentTypeLabels: Record<PitchDeckSlideContentType, string> = {
    title_only: copy.typeTitleOnly,
    title_bullets: copy.typeTitleBullets,
    title_text: copy.typeTitleText,
    title_image: copy.typeTitleImage,
    two_columns: copy.typeTwoColumns,
    comparison: copy.typeComparison,
    timeline: copy.typeTimeline,
    team_grid: copy.typeTeamGrid,
    metrics: copy.typeMetrics,
    quote: copy.typeQuote,
    blank: copy.typeBlank,
  };

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
      const content = buildContentFromDraft(contentType, slideTitle, draft, slide.content);
      await onSave({ title: slideTitle.trim() || slide.title, content });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const helpText = useMemo(() => {
    switch (contentType) {
      case "comparison":
        return copy.helpComparison;
      case "timeline":
        return copy.helpTimeline;
      case "team_grid":
        return copy.helpTeam;
      case "metrics":
        return copy.helpMetrics;
      default:
        return "";
    }
  }, [contentType, copy.helpComparison, copy.helpMetrics, copy.helpTeam, copy.helpTimeline]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{copy.editSlide}</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {!slide ? (
          <Typography sx={{ color: "#6B7280" }}>{copy.selectSlideToEdit}</Typography>
        ) : (
          <>
            <TextField
              label={copy.slideTitle}
              value={slideTitle}
              onChange={(e) => setSlideTitle(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>{copy.contentType}</InputLabel>
              <Select
                value={contentType}
                label={copy.contentType}
                onChange={(e) => handleContentTypeChange(e.target.value as PitchDeckSlideContentType)}
              >
                {CONTENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {contentTypeLabels[type]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {contentType !== "quote" && contentType !== "blank" ? (
              <TextField
                label={copy.contentTitle}
                value={draft.contentTitle}
                onChange={(e) => setDraft({ ...draft, contentTitle: e.target.value })}
                fullWidth
              />
            ) : null}

            {contentType === "title_only" ? (
              <TextField
                label={copy.subtitle}
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                fullWidth
              />
            ) : null}

            {contentType === "title_bullets" ? (
              <TextField
                label={copy.bullets}
                value={draft.bullets}
                onChange={(e) => setDraft({ ...draft, bullets: e.target.value })}
                fullWidth
                multiline
                minRows={4}
              />
            ) : null}

            {contentType === "title_text" ? (
              <TextField
                label={copy.bodyText}
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
                  label={copy.imageUrl}
                  value={draft.imageUrl}
                  onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                  fullWidth
                />
                <TextField
                  label={copy.imageAltText}
                  value={draft.imageAlt}
                  onChange={(e) => setDraft({ ...draft, imageAlt: e.target.value })}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>{copy.imagePosition}</InputLabel>
                  <Select
                    value={draft.imagePosition}
                    label={copy.imagePosition}
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
                    <MenuItem value="left">{copy.left}</MenuItem>
                    <MenuItem value="right">{copy.right}</MenuItem>
                    <MenuItem value="top">{copy.top}</MenuItem>
                    <MenuItem value="bottom">{copy.bottom}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            ) : null}

            {contentType === "two_columns" ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>
                    {copy.leftColumn}
                  </Typography>
                  <TextField
                    label={copy.leftTitle}
                    value={draft.leftTitle}
                    onChange={(e) => setDraft({ ...draft, leftTitle: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label={copy.leftText}
                    value={draft.leftText}
                    onChange={(e) => setDraft({ ...draft, leftText: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label={copy.leftBullets}
                    value={draft.leftBullets}
                    onChange={(e) => setDraft({ ...draft, leftBullets: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Stack>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>
                    {copy.rightColumn}
                  </Typography>
                  <TextField
                    label={copy.rightTitle}
                    value={draft.rightTitle}
                    onChange={(e) => setDraft({ ...draft, rightTitle: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label={copy.rightText}
                    value={draft.rightText}
                    onChange={(e) => setDraft({ ...draft, rightText: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label={copy.rightBullets}
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
                  label={copy.headers}
                  value={draft.headers}
                  onChange={(e) => setDraft({ ...draft, headers: e.target.value })}
                  fullWidth
                />
                <TextField
                  label={copy.rows}
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
                label={copy.timelineEntries}
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
                label={copy.teamMembers}
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
                label={copy.metrics}
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
                  label={copy.quote}
                  value={draft.quote}
                  onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
                  fullWidth
                  multiline
                  minRows={3}
                />
                <TextField
                  label={copy.author}
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                  fullWidth
                />
                <TextField
                  label={copy.authorTitle}
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
          {copy.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!slide || isSaving}
          sx={{ bgcolor: "#4C6AD2", "&:hover": { bgcolor: "#3D5ABF" } }}
        >
          {isSaving ? copy.saving : copy.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlideEditorModal;
