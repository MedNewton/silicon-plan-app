// src/components/workspaceManage/business-plan/SectionAiDrawer.tsx
"use client";

import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import { useParams } from "next/navigation";
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

import type { BusinessPlanSection, BusinessPlanSectionContent } from "@/types/workspaces";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type AiAction = "summarize" | "rephrase" | "simplify" | "detail" | "grammar" | "translate";

type SectionAiDrawerProps = {
  open: boolean;
  section: BusinessPlanSection | null;
  onClose: () => void;
  onSave: (content: BusinessPlanSectionContent) => Promise<void> | void;
};

const ACTIONS: Array<{
  id: AiAction;
  icon: typeof SummarizeRoundedIcon;
  hasMenu?: boolean;
}> = [
  { id: "summarize", icon: SummarizeRoundedIcon },
  { id: "rephrase", icon: FormatQuoteRoundedIcon },
  { id: "simplify", icon: TextFieldsRoundedIcon },
  { id: "detail", icon: NotesRoundedIcon },
  { id: "grammar", icon: SpellcheckRoundedIcon },
  { id: "translate", icon: TranslateRoundedIcon, hasMenu: true },
];

const TRANSLATE_LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "Arabic",
  "German",
  "Italian",
];

const SUPPORTED_TYPES = new Set([
  "text",
  "section_title",
  "subsection",
  "list",
  "table",
  "comparison_table",
]);

const isTextSection = (section: BusinessPlanSection | null) => {
  const type = section?.content?.type;
  return type ? SUPPORTED_TYPES.has(type) : false;
};

const serializeTable = (headers: string[], rows: string[][]) => {
  const headerLine = headers.join(" | ");
  const rowLines = rows.map((row) => row.join(" | "));
  return [headerLine, ...rowLines].filter((line) => line.trim().length > 0).join("\n");
};

const parseTable = (text: string): { headers: string[]; rows: string[][] } => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const splitLine = (line: string) => {
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
    return line.split(",").map((cell) => cell.trim());
  };
  const headers = splitLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => splitLine(line));
  return { headers, rows };
};

const getSectionText = (section: BusinessPlanSection | null): string => {
  if (!section) return "";
  const content = section.content;
  if (!content || typeof content !== "object") return "";
  if (content.type === "text" || content.type === "section_title" || content.type === "subsection") {
    return content.text ?? "";
  }
  if (content.type === "list") {
    return (content.items ?? []).join("\n");
  }
  if (content.type === "table" || content.type === "comparison_table") {
    return serializeTable(content.headers ?? [], content.rows ?? []);
  }
  return "";
};

const SectionAiDrawer: FC<SectionAiDrawerProps> = ({ open, section, onClose, onSave }) => {
  const { locale } = useLanguage();
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params?.workspaceId;
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [translateAnchor, setTranslateAnchor] = useState<null | HTMLElement>(null);

  const copy =
    locale === "it"
      ? {
          actionSummarize: "Riassumi",
          actionRephrase: "Parafrasa",
          actionSimplify: "Semplifica",
          actionDetail: "Spiega in dettaglio",
          actionGrammar: "Correggi grammatica",
          actionTranslate: "Traduci",
          toastGenerateFailed: "Impossibile generare suggerimento AI",
          toastSectionUpdated: "Sezione aggiornata",
          writeWithAi: "Scrivi con AI",
          save: "Salva",
          aiEditingOnlyText:
            "La modifica AI e disponibile solo per sezioni testuali.",
          contentPlaceholder: "Scrivi o migliora il contenuto della sezione...",
          listFormat: "Formato: un elemento elenco per riga.",
          tableFormat:
            'Formato: prima riga intestazioni, righe successive valori. Usa " | " tra le celle.',
        }
      : {
          actionSummarize: "Summarize",
          actionRephrase: "Rephrase/Paraphrase",
          actionSimplify: "Rewrite for Simplicity",
          actionDetail: "Explain in Detail",
          actionGrammar: "Correct Grammar",
          actionTranslate: "Translate",
          toastGenerateFailed: "Failed to generate AI suggestion",
          toastSectionUpdated: "Section updated",
          writeWithAi: "Write with AI",
          save: "Save",
          aiEditingOnlyText:
            "AI editing is available for text-based sections only.",
          contentPlaceholder: "Write or refine your section content...",
          listFormat: "Format: one list item per line.",
          tableFormat:
            'Format: first line headers, next lines rows. Use " | " between cells.',
        };

  const actionLabels: Record<AiAction, string> = {
    summarize: copy.actionSummarize,
    rephrase: copy.actionRephrase,
    simplify: copy.actionSimplify,
    detail: copy.actionDetail,
    grammar: copy.actionGrammar,
    translate: copy.actionTranslate,
  };

  const translateLanguages =
    locale === "it"
      ? [
          { value: "English", label: "Inglese" },
          { value: "French", label: "Francese" },
          { value: "Spanish", label: "Spagnolo" },
          { value: "Arabic", label: "Arabo" },
          { value: "German", label: "Tedesco" },
          { value: "Italian", label: "Italiano" },
        ]
      : TRANSLATE_LANGUAGES.map((lang) => ({ value: lang, label: lang }));

  useEffect(() => {
    if (open) {
      setDraftText(getSectionText(section));
    }
  }, [open, section]);

  const canEdit = useMemo(() => isTextSection(section), [section]);

  const handleAction = async (action: AiAction, language?: string) => {
    if (!section || !workspaceId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/business-plan/ai/section-suggest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: section.id,
            sectionType: section.content.type,
            action,
            text: draftText,
            language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate AI suggestion");
      }

      const data = (await response.json()) as { text: string };
      setDraftText(data.text ?? "");
    } catch (err) {
      console.error("AI suggestion error:", err);
      toast.error(copy.toastGenerateFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!section || !canEdit) return;
    const type = section.content.type;
    if (type === "list") {
      const items = draftText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      await onSave({
        type: "list",
        items,
        ordered: (section.content as BusinessPlanSectionContent & { ordered?: boolean })
          .ordered ?? false,
      } as BusinessPlanSectionContent);
    } else if (type === "table" || type === "comparison_table") {
      const parsed = parseTable(draftText);
      const fallback = section.content as BusinessPlanSectionContent & {
        headers?: string[];
        rows?: string[][];
      };
      const headers = parsed.headers.length > 0 ? parsed.headers : fallback.headers ?? [];
      const rows = parsed.rows.map((row) => {
        if (headers.length === 0) return row;
        const next = row.slice(0, headers.length);
        while (next.length < headers.length) next.push("");
        return next;
      });
      await onSave({
        type,
        headers,
        rows,
      } as BusinessPlanSectionContent);
    } else {
      await onSave({ type, text: draftText } as BusinessPlanSectionContent);
    }
    toast.success(copy.toastSectionUpdated);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 520,
          maxWidth: "100%",
          bgcolor: "#F4F5FC",
          borderLeft: "1px solid #E5E7EB",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: "#E3E4F5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #D8DAF0",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                bgcolor: "#5866E0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <AutoFixHighRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2A44" }}>
              {copy.writeWithAi}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              disabled={!canEdit || isLoading}
              sx={{
                textTransform: "none",
                bgcolor: "#1F2A44",
                borderRadius: 2,
                px: 3,
                "&:hover": { bgcolor: "#172036" },
                "&:disabled": { bgcolor: "#C7CBD8", color: "#FFFFFF" },
              }}
            >
              {copy.save}
            </Button>
            <IconButton
              onClick={onClose}
              sx={{
                bgcolor: "#1F2A44",
                color: "#FFFFFF",
                borderRadius: 2,
                "&:hover": { bgcolor: "#172036" },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
          {!canEdit ? (
            <Box
              sx={{
                borderRadius: 2,
                border: "1px dashed #C7CBD8",
                bgcolor: "#FFFFFF",
                p: 3,
              }}
            >
              <Typography sx={{ fontSize: 14, color: "#6B7280" }}>
                {copy.aiEditingOnlyText}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid #C7CBD8",
                bgcolor: "#FFFFFF",
                p: 2,
                mb: 3,
                boxShadow: "0 8px 18px rgba(31,42,68,0.08)",
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={10}
                maxRows={18}
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder={copy.contentPlaceholder}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    color: "#1F2A44",
                  },
                }}
              />
              {section?.content.type === "list" ? (
                <Typography sx={{ mt: 1, fontSize: 12, color: "#6B7280" }}>
                  {copy.listFormat}
                </Typography>
              ) : null}
              {section?.content.type === "table" ||
              section?.content.type === "comparison_table" ? (
                <Typography sx={{ mt: 1, fontSize: 12, color: "#6B7280" }}>
                  {copy.tableFormat}
                </Typography>
              ) : null}
            </Box>
          )}

          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              {ACTIONS.slice(0, 3).map((action) => {
                const Icon = action.icon;
                return (
                  <Box
                    key={action.id}
                    onClick={() => (action.hasMenu ? setTranslateAnchor(null) : void handleAction(action.id))}
                    sx={{
                      flex: 1,
                      bgcolor: "#ECECF8",
                      borderRadius: 2,
                      border: "1px solid #D4D7F0",
                      p: 2,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: "#5866E0", bgcolor: "#F1F2FF" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "#5866E0",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5,
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1F2A44" }}>
                      {actionLabels[action.id]}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
            <Stack direction="row" spacing={2}>
              {ACTIONS.slice(3).map((action) => {
                const Icon = action.icon;
                return (
                  <Box
                    key={action.id}
                    onClick={(event) => {
                      if (action.id === "translate") {
                        setTranslateAnchor(event.currentTarget);
                      } else {
                        void handleAction(action.id);
                      }
                    }}
                    sx={{
                      flex: 1,
                      bgcolor: "#ECECF8",
                      borderRadius: 2,
                      border: "1px solid #D4D7F0",
                      p: 2,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: "#5866E0", bgcolor: "#F1F2FF" },
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          bgcolor: "#5866E0",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1.5,
                        }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1F2A44" }}>
                        {actionLabels[action.id]}
                      </Typography>
                    </Box>
                    {action.hasMenu ? (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <ChevronRightRoundedIcon sx={{ color: "#5866E0" }} />
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </Box>

        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(244,245,252,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <CircularProgress sx={{ color: "#5866E0" }} />
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={translateAnchor}
        open={Boolean(translateAnchor)}
        onClose={() => setTranslateAnchor(null)}
      >
        {translateLanguages.map((lang) => (
          <MenuItem
            key={lang.value}
            onClick={() => {
              setTranslateAnchor(null);
              void handleAction("translate", lang.value);
            }}
          >
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </Drawer>
  );
};

export default SectionAiDrawer;
