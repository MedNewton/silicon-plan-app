// src/components/workspaceManage/pitch-deck/SlideAiDrawer.tsx
"use client";

import type { FC } from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
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
import type { SlideEditTarget } from "./SlidePreview";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type AiAction = "summarize" | "rephrase" | "simplify" | "detail" | "grammar" | "translate";

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

export type SlideAiDrawerProps = {
  open: boolean;
  workspaceId: string;
  target: SlideEditTarget | null;
  onClose: () => void;
  onApply: (text: string) => Promise<void> | void;
};

const SlideAiDrawer: FC<SlideAiDrawerProps> = ({
  open,
  workspaceId,
  target,
  onClose,
  onApply,
}) => {
  const { locale } = useLanguage();
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [translateAnchor, setTranslateAnchor] = useState<null | HTMLElement>(null);
  const [targetLanguage, setTargetLanguage] = useState("English");

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
          toastSlideUpdated: "Contenuto slide aggiornato",
          writeWithAi: "Scrivi con AI",
          selectedContent: "Contenuto selezionato",
          placeholder: "Seleziona contenuto da modificare",
          cancel: "Annulla",
          apply: "Applica",
        }
      : {
          actionSummarize: "Summarize",
          actionRephrase: "Rephrase/Paraphrase",
          actionSimplify: "Rewrite for Simplicity",
          actionDetail: "Explain in Detail",
          actionGrammar: "Correct Grammar",
          actionTranslate: "Translate",
          toastGenerateFailed: "Failed to generate AI suggestion",
          toastSlideUpdated: "Slide content updated",
          writeWithAi: "Write with AI",
          selectedContent: "Selected content",
          placeholder: "Select content to edit",
          cancel: "Cancel",
          apply: "Apply",
        };

  const actionLabels: Record<AiAction, string> = useMemo(
    () => ({
      summarize: copy.actionSummarize,
      rephrase: copy.actionRephrase,
      simplify: copy.actionSimplify,
      detail: copy.actionDetail,
      grammar: copy.actionGrammar,
      translate: copy.actionTranslate,
    }),
    [
      copy.actionSummarize,
      copy.actionRephrase,
      copy.actionSimplify,
      copy.actionDetail,
      copy.actionGrammar,
      copy.actionTranslate,
    ]
  );

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
      setDraftText(target?.text ?? "");
    }
  }, [open, target]);

  const handleAction = useCallback(async (action: AiAction, language?: string) => {
    if (!workspaceId || !target) return;
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
            label: target.label,
            formatHint: target.formatHint,
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
  }, [workspaceId, target, draftText, copy.toastGenerateFailed]);

  const handleSave = async () => {
    if (!target) return;
    await onApply(draftText);
    toast.success(copy.toastSlideUpdated);
    onClose();
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
          startIcon={<action.icon />}
          endIcon={action.hasMenu ? <ChevronRightRoundedIcon /> : undefined}
          sx={{
            flex: "1 1 calc(50% - 12px)",
            justifyContent: "flex-start",
            borderRadius: 2,
            border: "1px solid #DDE1F0",
            color: "#1F2937",
            bgcolor: "#EEF0FA",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            px: 2,
            py: 1.6,
            gap: 1.5,
            "&:hover": {
              bgcolor: "#E4E7F6",
            },
          }}
        >
          {actionLabels[action.id]}
        </Button>
      )),
    [handleAction, actionLabels]
  );

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <AutoFixHighRoundedIcon sx={{ color: "#5B61D6" }} />
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#2B2E4A" }}>
              {copy.writeWithAi}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#4B5563" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 3,
            py: 3,
          }}
        >
          <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 1 }}>
            {target?.label ?? copy.selectedContent}
          </Typography>
          <TextField
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            multiline
            minRows={8}
            fullWidth
            placeholder={copy.placeholder}
            sx={{
              mb: 3,
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {actionButtons}
          </Stack>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            gap: 1.5,
          }}
        >
          <Button
            onClick={onClose}
            disabled={isLoading}
            sx={{
              flex: 1,
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              py: 1.2,
              borderRadius: 2,
              color: "#374151",
              bgcolor: "#F3F4F6",
              "&:hover": {
                bgcolor: "#E5E7EB",
              },
            }}
          >
            {copy.cancel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !draftText.trim()}
            sx={{
              flex: 1,
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              py: 1.2,
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
            {isLoading ? <CircularProgress size={18} sx={{ color: "#FFFFFF" }} /> : copy.apply}
          </Button>
        </Box>
      </Box>

      <Menu
        anchorEl={translateAnchor}
        open={Boolean(translateAnchor)}
        onClose={() => setTranslateAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {translateLanguages.map((lang) => (
          <MenuItem
            key={lang.value}
            selected={lang.value === targetLanguage}
            onClick={() => {
              setTranslateAnchor(null);
              setTargetLanguage(lang.value);
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

export default SlideAiDrawer;
