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

type AiAction = "summarize" | "rephrase" | "simplify" | "detail" | "grammar" | "translate";

const ACTIONS: Array<{
  id: AiAction;
  label: string;
  icon: typeof SummarizeRoundedIcon;
  hasMenu?: boolean;
}> = [
  { id: "summarize", label: "Summarize", icon: SummarizeRoundedIcon },
  { id: "rephrase", label: "Rephrase/Paraphrase", icon: FormatQuoteRoundedIcon },
  { id: "simplify", label: "Rewrite for Simplicity", icon: TextFieldsRoundedIcon },
  { id: "detail", label: "Explain in Detail", icon: NotesRoundedIcon },
  { id: "grammar", label: "Correct Grammar", icon: SpellcheckRoundedIcon },
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
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [translateAnchor, setTranslateAnchor] = useState<null | HTMLElement>(null);
  const [targetLanguage, setTargetLanguage] = useState("English");

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
      toast.error("Failed to generate AI suggestion");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, target, draftText]);

  const handleSave = async () => {
    if (!target) return;
    await onApply(draftText);
    toast.success("Slide content updated");
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
          {action.label}
        </Button>
      )),
    [handleAction]
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
              Write with AI
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
            {target?.label ?? "Selected content"}
          </Typography>
          <TextField
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            multiline
            minRows={8}
            fullWidth
            placeholder="Select content to edit"
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
            Cancel
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
            {isLoading ? <CircularProgress size={18} sx={{ color: "#FFFFFF" }} /> : "Apply"}
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
        {TRANSLATE_LANGUAGES.map((lang) => (
          <MenuItem
            key={lang}
            selected={lang === targetLanguage}
            onClick={() => {
              setTranslateAnchor(null);
              setTargetLanguage(lang);
              void handleAction("translate", lang);
            }}
          >
            {lang}
          </MenuItem>
        ))}
      </Menu>
    </Drawer>
  );
};

export default SlideAiDrawer;
