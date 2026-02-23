// src/components/workspaceManage/business-plan/ConfirmGenerateModal.tsx
"use client";

import { useState, useEffect, type FC } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type ConfirmGenerateModalProps = {
  open: boolean;
  isGenerating?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const EN_LOADING_PHRASES = [
  "Analyzing your knowledge base...",
  "Crafting executive summary...",
  "Structuring market analysis...",
  "Writing financial projections...",
  "Polishing business strategy...",
  "Refining competitive analysis...",
  "Building revenue model...",
  "Finalizing your business plan...",
];

const IT_LOADING_PHRASES = [
  "Analisi della base di conoscenza...",
  "Creazione del sommario esecutivo...",
  "Strutturazione dell'analisi di mercato...",
  "Scrittura delle proiezioni finanziarie...",
  "Perfezionamento della strategia...",
  "Analisi della concorrenza...",
  "Costruzione del modello di ricavi...",
  "Finalizzazione del business plan...",
];

const ConfirmGenerateModal: FC<ConfirmGenerateModalProps> = ({
  open,
  isGenerating = false,
  onConfirm,
  onCancel,
}) => {
  const { locale } = useLanguage();
  const [phraseIndex, setPhraseIndex] = useState(0);

  const loadingPhrases =
    locale === "it" ? IT_LOADING_PHRASES : EN_LOADING_PHRASES;

  // Cycle through loading phrases
  useEffect(() => {
    if (!isGenerating) {
      setPhraseIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isGenerating, loadingPhrases.length]);

  const copy =
    locale === "it"
      ? {
          title: "Genera Business Plan con AI",
          description:
            "Il contenuto del business plan verrà generato utilizzando la base di conoscenza del tuo workspace (note e documenti).",
          warning:
            "Questo sovrascriverà qualsiasi contenuto esistente nel business plan.",
          cancel: "Annulla",
          generate: "Genera",
        }
      : {
          title: "Generate Business Plan with AI",
          description:
            "Your business plan content will be generated using your workspace knowledge base (notes and documents).",
          warning:
            "This will override any existing content in your business plan.",
          cancel: "Cancel",
          generate: "Generate",
        };

  return (
    <Dialog
      open={open}
      onClose={isGenerating ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      {isGenerating ? (
        /* ── LOADING STATE ── */
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 6,
            px: 4,
            minHeight: 260,
          }}
        >
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3.5,
            }}
          >
            <CircularProgress
              size={72}
              thickness={3}
              sx={{
                color: "#4C6AD2",
              }}
            />
            <AutoFixHighIcon
              sx={{
                position: "absolute",
                fontSize: 28,
                color: "#4C6AD2",
              }}
            />
          </Box>

          <Typography
            key={phraseIndex}
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: "#374151",
              textAlign: "center",
              animation: "fadeInUp 0.4s ease",
              "@keyframes fadeInUp": {
                from: { opacity: 0, transform: "translateY(8px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            {loadingPhrases[phraseIndex]}
          </Typography>

          <Typography
            sx={{
              fontSize: 12.5,
              color: "#9CA3AF",
              mt: 1.5,
              textAlign: "center",
            }}
          >
            {locale === "it"
              ? "Questo potrebbe richiedere un paio di minuti"
              : "This may take a couple of minutes"}
          </Typography>
        </DialogContent>
      ) : (
        /* ── CONFIRMATION STATE ── */
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AutoFixHighIcon sx={{ fontSize: 22, color: "#4C6AD2" }} />
              </Box>
              <Typography
                sx={{ fontSize: 18, fontWeight: 600, color: "#111827" }}
              >
                {copy.title}
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 1 }}>
            <Typography
              sx={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6 }}
            >
              {copy.description}
            </Typography>
            <Box
              sx={{
                mt: 2,
                px: 2,
                py: 1.5,
                bgcolor: "#FFFBEB",
                borderRadius: 2,
                border: "1px solid #FDE68A",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#92400E",
                  lineHeight: 1.5,
                }}
              >
                {copy.warning}
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5 }}>
            <Button
              onClick={onCancel}
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
              onClick={onConfirm}
              sx={{
                flex: 1,
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                py: 1.2,
                borderRadius: 2,
                color: "#FFFFFF",
                background:
                  "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #3F5ABF 0%, #6B3FC6 100%)",
                },
              }}
            >
              {copy.generate}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ConfirmGenerateModal;
